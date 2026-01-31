# In-App Messaging System - Implementation Plan

## Overview

This plan implements a real-time messaging system that allows **students** and **recruiters** to communicate within the context of an accepted internship. Messages are only available after an application is accepted/in_progress, ensuring focused communication around active work.

---

## Requirements Summary

| Requirement | Decision |
|-------------|----------|
| Participants | Student ↔ Recruiter (1:1 per internship) |
| Availability | Only after application status = `accepted` or `in_progress` |
| Features | Text messages + read receipts |
| Notifications | In-app unread badge (navbar) |
| Real-time | Yes, using Supabase Realtime |

---

## Database Design

### New Tables

#### 1. `conversations` Table

Represents a messaging thread tied to a specific application/internship.

```sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  recruiter_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(application_id) -- One conversation per application
);

-- Index for fast lookups
CREATE INDEX idx_conversations_student ON public.conversations(student_id);
CREATE INDEX idx_conversations_recruiter ON public.conversations(recruiter_id);
```

#### 2. `messages` Table

Stores individual messages within a conversation.

```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ, -- NULL = unread, timestamp = read
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching messages in order
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;
```

### RLS Policies

#### conversations Table

```sql
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Students can view their conversations
CREATE POLICY "Students can view their conversations"
ON public.conversations FOR SELECT
USING (student_id = auth.uid());

-- Recruiters can view their conversations
CREATE POLICY "Recruiters can view their conversations"
ON public.conversations FOR SELECT
USING (recruiter_id = auth.uid());

-- System creates conversations (via trigger or function)
CREATE POLICY "System can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  student_id = auth.uid() OR recruiter_id = auth.uid()
);
```

#### messages Table

```sql
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.student_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);

-- Participants can send messages to their conversations
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.student_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark messages read"
ON public.messages FOR UPDATE
USING (
  sender_id != auth.uid() -- Can only update messages you didn't send
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.student_id = auth.uid() OR c.recruiter_id = auth.uid())
  )
)
WITH CHECK (
  sender_id != auth.uid()
);
```

### Realtime Configuration

```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### Database Function: Create Conversation

Automatically create a conversation when an application is accepted.

```sql
CREATE OR REPLACE FUNCTION public.create_conversation_on_accept()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create conversation when status changes to 'accepted' or 'in_progress'
  IF (NEW.status IN ('accepted', 'in_progress') AND OLD.status = 'pending') THEN
    INSERT INTO public.conversations (application_id, student_id, recruiter_id)
    SELECT 
      NEW.id,
      NEW.student_id,
      o.recruiter_id
    FROM public.opportunities o
    WHERE o.id = NEW.opportunity_id
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to applications table
CREATE TRIGGER on_application_accepted
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.create_conversation_on_accept();
```

---

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Student/       │────▶│  Supabase        │────▶│  messages       │
│  Recruiter UI   │     │  Realtime        │     │  table          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        ▲                        │
        │                        │                        │
        ▼                        │                        ▼
┌─────────────────┐              │              ┌─────────────────┐
│  useMessages    │──────────────┴──────────────│  conversations  │
│  hook           │                             │  table          │
└─────────────────┘                             └─────────────────┘
```

---

## Component Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useConversations.ts` | Fetch user's conversations with unread counts |
| `src/hooks/useMessages.ts` | Fetch, send, and subscribe to messages |
| `src/hooks/useUnreadCount.ts` | Global unread message count for badge |
| `src/components/messaging/ConversationList.tsx` | List of all conversations |
| `src/components/messaging/ConversationItem.tsx` | Single conversation preview |
| `src/components/messaging/ChatWindow.tsx` | Full chat interface |
| `src/components/messaging/MessageBubble.tsx` | Single message display |
| `src/components/messaging/MessageInput.tsx` | Text input with send button |
| `src/components/messaging/UnreadBadge.tsx` | Notification badge component |
| `src/pages/student/Messages.tsx` | Student messages page |
| `src/pages/recruiter/Messages.tsx` | Recruiter messages page |

---

## Hook Implementations

### useConversations Hook

```typescript
// src/hooks/useConversations.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Conversation {
  id: string;
  application_id: string;
  student_id: string;
  recruiter_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  other_user_name: string;
  opportunity_title: string;
  company_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export function useConversations() {
  const { user, role } = useAuth();
  
  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      // Fetch conversations with related data
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          application:applications!inner(
            opportunity:opportunities!inner(title, company_name)
          )
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      
      // Get unread counts and last messages
      // ... additional queries for enrichment
      
      return data as Conversation[];
    },
    enabled: !!user,
  });
}
```

### useMessages Hook

```typescript
// src/hooks/useMessages.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch messages
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId && !!user,
  });
  
  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId || !user) return;
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ["messages", conversationId],
            (old: Message[] = []) => [...old, payload.new as Message]
          );
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);
  
  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Update conversation's updated_at
      supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
  });
  
  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user!.id)
        .is("read_at", null);
      
      if (error) throw error;
    },
  });
  
  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    sendMessage,
    markAsRead,
  };
}
```

### useUnreadCount Hook

```typescript
// src/hooks/useUnreadCount.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUnreadCount() {
  const { user } = useAuth();
  
  const query = useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      // Get conversations for this user
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id");
      
      if (!conversations?.length) return 0;
      
      // Count unread messages across all conversations
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversations.map(c => c.id))
        .neq("sender_id", user!.id)
        .is("read_at", null);
      
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Subscribe to new messages for real-time badge updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          query.refetch();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  return query.data ?? 0;
}
```

---

## UI Components

### ChatWindow Component

```typescript
// src/components/messaging/ChatWindow.tsx
interface ChatWindowProps {
  conversationId: string;
  otherUserName: string;
  opportunityTitle: string;
}

export function ChatWindow({ conversationId, otherUserName, opportunityTitle }: ChatWindowProps) {
  const { messages, isLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead.mutate();
  }, [messages.length]);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="font-semibold">{otherUserName}</h2>
        <p className="text-sm text-muted-foreground">{opportunityTitle}</p>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            isOwn={message.sender_id === user?.id}
            timestamp={message.created_at}
            isRead={!!message.read_at}
          />
        ))}
        <div ref={scrollRef} />
      </ScrollArea>
      
      {/* Input */}
      <MessageInput onSend={(text) => sendMessage.mutate(text)} />
    </div>
  );
}
```

### MessageBubble Component

```typescript
// src/components/messaging/MessageBubble.tsx
interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  timestamp: string;
  isRead: boolean;
}

export function MessageBubble({ content, isOwn, timestamp, isRead }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex mb-3",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] rounded-lg px-4 py-2",
        isOwn 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <p className="text-sm">{content}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs opacity-70">
            {format(new Date(timestamp), "HH:mm")}
          </span>
          {isOwn && (
            <Check className={cn(
              "h-3 w-3",
              isRead ? "text-blue-400" : "opacity-50"
            )} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Page Layout

### Messages Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│ [Navbar with Messages Badge]                                  │
├────────────────────┬─────────────────────────────────────────┤
│  Conversations     │  Chat Window                             │
│  ┌──────────────┐  │  ┌─────────────────────────────────────┐ │
│  │ Company A    │  │  │ Header: John Doe - Marketing Role   │ │
│  │ 2 unread     │  │  ├─────────────────────────────────────┤ │
│  ├──────────────┤  │  │                                     │ │
│  │ Company B    │  │  │ [Messages scroll area]              │ │
│  │ Last: Hello  │  │  │                                     │ │
│  ├──────────────┤  │  │                                     │ │
│  │ Company C    │  │  ├─────────────────────────────────────┤ │
│  │ Completed    │  │  │ [Type a message...]  [Send]         │ │
│  └──────────────┘  │  └─────────────────────────────────────┘ │
└────────────────────┴─────────────────────────────────────────┘
```

---

## Integration Points

### 1. Navbar Update

Add unread badge to navigation:

```typescript
// In Navbar.tsx
const unreadCount = useUnreadCount();

<NavLink to="/student/messages" className="relative">
  <MessageSquare className="h-5 w-5" />
  {unreadCount > 0 && (
    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  )}
</NavLink>
```

### 2. Application Card Enhancement

Add "Message" button on accepted applications:

```typescript
// In student/Applications.tsx
{application.status === "accepted" || application.status === "in_progress" && (
  <Button variant="outline" size="sm" asChild>
    <Link to={`/student/messages?app=${application.id}`}>
      <MessageSquare className="h-4 w-4 mr-2" />
      Message Recruiter
    </Link>
  </Button>
)}
```

### 3. Recruiter Dashboard

Add messaging quick access from applicant management:

```typescript
// In recruiter/ManageApplicants.tsx
{applicant.status === "accepted" && (
  <Button variant="ghost" size="icon">
    <Link to={`/recruiter/messages?app=${applicant.id}`}>
      <MessageSquare className="h-4 w-4" />
    </Link>
  </Button>
)}
```

---

## Routes to Add

```typescript
// In App.tsx
<Route path="/student/messages" element={<ProtectedRoute role="student"><StudentMessages /></ProtectedRoute>} />
<Route path="/recruiter/messages" element={<ProtectedRoute role="recruiter"><RecruiterMessages /></ProtectedRoute>} />
```

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useConversations.ts` | Create | Fetch conversations list |
| `src/hooks/useMessages.ts` | Create | Messages CRUD + realtime |
| `src/hooks/useUnreadCount.ts` | Create | Global unread count |
| `src/components/messaging/ConversationList.tsx` | Create | Sidebar conversation list |
| `src/components/messaging/ConversationItem.tsx` | Create | Single conversation preview |
| `src/components/messaging/ChatWindow.tsx` | Create | Main chat interface |
| `src/components/messaging/MessageBubble.tsx` | Create | Message display |
| `src/components/messaging/MessageInput.tsx` | Create | Text input with send |
| `src/pages/student/Messages.tsx` | Create | Student messages page |
| `src/pages/recruiter/Messages.tsx` | Create | Recruiter messages page |
| `src/components/Navbar.tsx` | Update | Add messages badge |
| `src/App.tsx` | Update | Add message routes |

---

## Implementation Order

1. **Database Migration** - Create tables, RLS policies, trigger
2. **Core Hooks** - `useMessages`, `useConversations`, `useUnreadCount`
3. **UI Components** - MessageBubble, MessageInput, ChatWindow
4. **Pages** - Student and Recruiter message pages
5. **Navigation** - Add routes and navbar badge
6. **Integration** - Add "Message" buttons to applications

---

## Edge Cases Handled

1. **No conversations yet**: Empty state with explanation
2. **Application rejected/withdrawn**: Conversation remains read-only or hidden
3. **User offline**: Messages queue and sync when back online (Supabase handles)
4. **Long messages**: Word wrap and scrollable bubbles
5. **Rapid messages**: Optimistic updates with realtime sync

---

## Security Considerations

- ✅ RLS ensures users can only see their own conversations
- ✅ Messages can only be sent by conversation participants
- ✅ Read receipts can only be set by message recipients
- ✅ Conversations auto-created by trigger (no user manipulation)
- ✅ No message deletion to preserve audit trail

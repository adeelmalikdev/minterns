import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Conversation {
  id: string;
  application_id: string;
  student_id: string;
  recruiter_id: string;
  created_at: string;
  updated_at: string;
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
      if (!user) return [];

      // Fetch conversations with application and opportunity data
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select(`
          *,
          application:applications!inner(
            opportunity:opportunities!inner(title, company_name, recruiter_id),
            student_id
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!conversations?.length) return [];

      // Get other user profiles
      const otherUserIds = conversations.map((c) =>
        role === "student" ? c.recruiter_id : c.student_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", otherUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Get last messages and unread counts
      const conversationIds = conversations.map((c) => c.id);

      const { data: lastMessages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      const lastMessageMap = new Map<string, { content: string; created_at: string }>();
      lastMessages?.forEach((m) => {
        if (!lastMessageMap.has(m.conversation_id)) {
          lastMessageMap.set(m.conversation_id, { content: m.content, created_at: m.created_at });
        }
      });

      // Get unread counts
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      const unreadCountMap = new Map<string, number>();
      unreadMessages?.forEach((m) => {
        unreadCountMap.set(m.conversation_id, (unreadCountMap.get(m.conversation_id) || 0) + 1);
      });

      // Map to enriched conversations
      return conversations.map((conv): Conversation => {
        const otherUserId = role === "student" ? conv.recruiter_id : conv.student_id;
        const otherProfile = profileMap.get(otherUserId);
        const lastMessage = lastMessageMap.get(conv.id);

        return {
          id: conv.id,
          application_id: conv.application_id,
          student_id: conv.student_id,
          recruiter_id: conv.recruiter_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          other_user_name: otherProfile?.full_name || otherProfile?.email || "Unknown",
          opportunity_title: conv.application.opportunity.title,
          company_name: conv.application.opportunity.company_name,
          last_message: lastMessage?.content || null,
          last_message_at: lastMessage?.created_at || null,
          unread_count: unreadCountMap.get(conv.id) || 0,
        };
      });
    },
    enabled: !!user,
  });
}

export function useConversationByApplication(applicationId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversation", "application", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("application_id", applicationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!applicationId,
  });
}

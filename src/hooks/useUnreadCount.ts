import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get conversations for this user
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id");

      if (!conversations?.length) return 0;

      // Count unread messages across all conversations
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in(
          "conversation_id",
          conversations.map((c) => c.id)
        )
        .neq("sender_id", user.id)
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
      .channel("unread-messages-global")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Only refetch if the message is not from the current user
          if ((payload.new as { sender_id: string }).sender_id !== user.id) {
            query.refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query.data ?? 0;
}

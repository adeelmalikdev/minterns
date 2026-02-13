import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This edge function handles email notification triggers.
// In production, you'd integrate with a real email service (Resend, SendGrid, etc.).
// For now, it logs notifications and creates in-app notifications.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event_type, data } = await req.json();

    let notifications: Array<{
      user_id: string;
      title: string;
      message: string;
      type: string;
      metadata?: Record<string, unknown>;
    }> = [];

    switch (event_type) {
      case "application_status_changed": {
        const { application_id, student_id, status, opportunity_title } = data;
        const statusMessages: Record<string, string> = {
          accepted: `Congratulations! Your application for "${opportunity_title}" has been accepted.`,
          rejected: `Your application for "${opportunity_title}" has been reviewed. Unfortunately, it was not selected.`,
          in_progress: `Your internship for "${opportunity_title}" is now in progress!`,
          completed: `You've completed the internship for "${opportunity_title}". Check for your certificate!`,
        };
        if (statusMessages[status]) {
          notifications.push({
            user_id: student_id,
            title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: statusMessages[status],
            type: "application_update",
            metadata: { application_id, status },
          });
        }
        break;
      }

      case "new_application": {
        const { recruiter_id, student_name, opportunity_title, application_id } = data;
        notifications.push({
          user_id: recruiter_id,
          title: "New Application Received",
          message: `${student_name} has applied for "${opportunity_title}".`,
          type: "new_application",
          metadata: { application_id },
        });
        break;
      }

      case "new_message": {
        const { recipient_id, sender_name, conversation_id } = data;
        notifications.push({
          user_id: recipient_id,
          title: "New Message",
          message: `You have a new message from ${sender_name}.`,
          type: "new_message",
          metadata: { conversation_id },
        });
        break;
      }

      case "certificate_awarded": {
        const { student_id, opportunity_title, certificate_id } = data;
        notifications.push({
          user_id: student_id,
          title: "Certificate Awarded! 🎉",
          message: `You've been awarded a certificate for completing "${opportunity_title}".`,
          type: "certificate",
          metadata: { certificate_id },
        });
        break;
      }

      case "deadline_reminder": {
        const { student_id, task_title, opportunity_title, days_remaining } = data;
        notifications.push({
          user_id: student_id,
          title: "Deadline Approaching",
          message: `Task "${task_title}" for "${opportunity_title}" is due in ${days_remaining} days.`,
          type: "deadline_reminder",
          metadata: { days_remaining },
        });
        break;
      }

      case "new_matching_opportunity": {
        const { student_id, opportunity_title, opportunity_id } = data;
        notifications.push({
          user_id: student_id,
          title: "New Opportunity Match",
          message: `A new opportunity "${opportunity_title}" matches your skills!`,
          type: "opportunity_match",
          metadata: { opportunity_id },
        });
        break;
      }

      case "feedback_received": {
        const { student_id, opportunity_title, rating } = data;
        notifications.push({
          user_id: student_id,
          title: "Feedback Received",
          message: `You received ${rating}/5 rating for "${opportunity_title}".`,
          type: "feedback",
          metadata: { rating },
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown event type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) {
        console.error("Failed to insert notifications:", error);
        throw error;
      }
    }

    console.log(`Processed ${event_type}: created ${notifications.length} notifications`);

    return new Response(JSON.stringify({ success: true, count: notifications.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-notification-email error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

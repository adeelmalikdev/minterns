import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Fetch all user data in parallel
    const [
      profileResult,
      applicationsResult,
      messagesResult,
      feedbackResult,
      certificatesResult,
      conversationsResult,
      taskSubmissionsResult,
      twoFaResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("applications").select("*").eq("student_id", userId),
      supabase.from("messages").select("*").eq("sender_id", userId),
      supabase.from("feedback").select("*").eq("evaluator_id", userId),
      supabase.from("certificates").select("*").eq("student_id", userId),
      supabase.from("conversations").select("*").or(`student_id.eq.${userId},recruiter_id.eq.${userId}`),
      supabase.from("task_submissions").select("*").eq("student_id", userId),
      supabase.from("user_2fa").select("totp_enabled, created_at, updated_at").eq("user_id", userId).single(),
    ]);

    // Compile export data
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userId: userId,
        userEmail: user.email,
        format: "GDPR Data Export",
        version: "1.0",
      },
      profile: profileResult.data
        ? {
            fullName: profileResult.data.full_name,
            email: profileResult.data.email,
            avatarUrl: profileResult.data.avatar_url,
            themePreference: profileResult.data.theme_preference,
            languagePreference: profileResult.data.language_preference,
            createdAt: profileResult.data.created_at,
            updatedAt: profileResult.data.updated_at,
          }
        : null,
      security: {
        twoFactorEnabled: twoFaResult.data?.totp_enabled ?? false,
        twoFactorSetupDate: twoFaResult.data?.created_at ?? null,
      },
      applications: (applicationsResult.data || []).map((app) => ({
        id: app.id,
        opportunityId: app.opportunity_id,
        status: app.status,
        coverLetter: app.cover_letter,
        resumeUrl: app.resume_url ? "[File stored in secure storage]" : null,
        createdAt: app.created_at,
        updatedAt: app.updated_at,
      })),
      conversations: (conversationsResult.data || []).map((conv) => ({
        id: conv.id,
        applicationId: conv.application_id,
        role: conv.student_id === userId ? "student" : "recruiter",
        createdAt: conv.created_at,
      })),
      messages: (messagesResult.data || []).map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        content: msg.content,
        sentAt: msg.created_at,
        readAt: msg.read_at,
      })),
      taskSubmissions: (taskSubmissionsResult.data || []).map((sub) => ({
        id: sub.id,
        taskId: sub.task_id,
        applicationId: sub.application_id,
        status: sub.status,
        submissionUrl: sub.submission_url,
        notes: sub.notes,
        feedback: sub.feedback,
        submittedAt: sub.submitted_at,
        reviewedAt: sub.reviewed_at,
      })),
      feedbackGiven: (feedbackResult.data || []).map((fb) => ({
        id: fb.id,
        applicationId: fb.application_id,
        rating: fb.rating,
        comments: fb.comments,
        skillsDemonstrated: fb.skills_demonstrated,
        createdAt: fb.created_at,
      })),
      certificates: (certificatesResult.data || []).map((cert) => ({
        id: cert.id,
        applicationId: cert.application_id,
        verificationCode: cert.verification_code,
        issuedAt: cert.issued_at,
      })),
      metadata: {
        totalApplications: applicationsResult.data?.length || 0,
        totalMessages: messagesResult.data?.length || 0,
        totalCertificates: certificatesResult.data?.length || 0,
        accountCreated: profileResult.data?.created_at,
      },
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="user-data-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      }
    );
  } catch (error) {
    console.error("Data export error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

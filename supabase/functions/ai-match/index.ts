import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { type, limit = 5 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (type === "student-recommendations") {
      // Get student's applications and profile
      const [{ data: applications }, { data: profile }, { data: opportunities }] = await Promise.all([
        supabase.from("applications").select("opportunity_id, status").eq("student_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("opportunities").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(20),
      ]);

      const appliedIds = applications?.map(a => a.opportunity_id) || [];
      const availableOpps = opportunities?.filter(o => !appliedIds.includes(o.id)) || [];

      // Get skills from past applications
      const pastOppIds = applications?.filter(a => a.status !== "withdrawn").map(a => a.opportunity_id) || [];
      let pastSkills: string[] = [];
      if (pastOppIds.length > 0) {
        const { data: pastOpps } = await supabase.from("opportunities").select("skills_required, level").in("id", pastOppIds);
        pastSkills = pastOpps?.flatMap(o => o.skills_required) || [];
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a career matching AI. Rank opportunities by relevance to the student. Return ONLY a JSON array of opportunity IDs in order of best match." },
            { role: "user", content: `Student profile: ${profile?.full_name || "Unknown"}\nPast skills demonstrated: ${[...new Set(pastSkills)].join(", ") || "None yet"}\nPast application statuses: ${applications?.map(a => a.status).join(", ") || "None"}\n\nAvailable opportunities:\n${availableOpps.map(o => `ID: ${o.id} | Title: ${o.title} | Company: ${o.company_name} | Skills: ${o.skills_required.join(", ")} | Level: ${o.level} | Remote: ${o.is_remote}`).join("\n")}\n\nReturn top ${limit} opportunity IDs as JSON array.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "rank_opportunities",
              description: "Return ranked opportunity IDs",
              parameters: {
                type: "object",
                properties: {
                  ranked_ids: { type: "array", items: { type: "string" } },
                  reasons: { type: "object", additionalProperties: { type: "string" } }
                },
                required: ["ranked_ids"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "rank_opportunities" } },
        }),
      });

      if (!response.ok) {
        // Fallback: return most recent opportunities
        return new Response(JSON.stringify({ matches: availableOpps.slice(0, limit), reasons: {} }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      let rankedIds: string[] = [];
      let reasons: Record<string, string> = {};

      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        rankedIds = parsed.ranked_ids || [];
        reasons = parsed.reasons || {};
      }

      // Map IDs back to full opportunity objects
      const matches = rankedIds
        .map(id => availableOpps.find(o => o.id === id))
        .filter(Boolean)
        .slice(0, limit);

      // Fill with remaining if AI didn't return enough
      if (matches.length < limit) {
        const matchedIds = new Set(matches.map(m => m!.id));
        for (const opp of availableOpps) {
          if (!matchedIds.has(opp.id)) {
            matches.push(opp);
            if (matches.length >= limit) break;
          }
        }
      }

      return new Response(JSON.stringify({ matches, reasons }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "recruiter-candidates") {
      const { opportunity_id } = await req.json().catch(() => ({}));
      
      // Get the opportunity
      const { data: opportunity } = await supabase
        .from("opportunities").select("*").eq("id", opportunity_id).single();

      if (!opportunity) throw new Error("Opportunity not found");

      // Get all students who haven't applied yet
      const { data: existingApps } = await supabase
        .from("applications").select("student_id").eq("opportunity_id", opportunity_id);
      const appliedStudentIds = existingApps?.map(a => a.student_id) || [];

      // Get student profiles with their application history
      const { data: allStudents } = await supabase
        .from("profiles").select("user_id, full_name, email");

      // Get student roles
      const { data: studentRoles } = await supabase
        .from("user_roles").select("user_id").eq("role", "student");
      const studentUserIds = new Set(studentRoles?.map(r => r.user_id) || []);

      const eligibleStudents = allStudents
        ?.filter(s => studentUserIds.has(s.user_id) && !appliedStudentIds.includes(s.user_id))
        .slice(0, 20) || [];

      // Get past application data for these students
      const studentIds = eligibleStudents.map(s => s.user_id);
      const { data: pastApps } = await supabase
        .from("applications").select("student_id, opportunity_id, status").in("student_id", studentIds);

      const pastOppIds = [...new Set(pastApps?.map(a => a.opportunity_id) || [])];
      const { data: pastOpps } = await supabase
        .from("opportunities").select("id, skills_required, level").in("id", pastOppIds.length > 0 ? pastOppIds : ["none"]);

      // Build student skill profiles
      const studentSkills: Record<string, string[]> = {};
      pastApps?.forEach(app => {
        const opp = pastOpps?.find(o => o.id === app.opportunity_id);
        if (opp) {
          if (!studentSkills[app.student_id]) studentSkills[app.student_id] = [];
          studentSkills[app.student_id].push(...opp.skills_required);
        }
      });

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a recruitment matching AI. Rank candidates by fit for the opportunity. Return ONLY structured output via tool call." },
            { role: "user", content: `Opportunity: ${opportunity.title}\nSkills needed: ${opportunity.skills_required.join(", ")}\nLevel: ${opportunity.level}\n\nCandidates:\n${eligibleStudents.map(s => `ID: ${s.user_id} | Name: ${s.full_name || "Unknown"} | Skills: ${[...new Set(studentSkills[s.user_id] || [])].join(", ") || "No history"}`).join("\n")}\n\nRank top ${limit} candidates.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "rank_candidates",
              description: "Return ranked candidate IDs with match reasons",
              parameters: {
                type: "object",
                properties: {
                  ranked_ids: { type: "array", items: { type: "string" } },
                  reasons: { type: "object", additionalProperties: { type: "string" } }
                },
                required: ["ranked_ids"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "rank_candidates" } },
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ candidates: eligibleStudents.slice(0, limit), reasons: {} }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      let rankedIds: string[] = [];
      let reasons: Record<string, string> = {};

      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        rankedIds = parsed.ranked_ids || [];
        reasons = parsed.reasons || {};
      }

      const candidates = rankedIds
        .map(id => eligibleStudents.find(s => s.user_id === id))
        .filter(Boolean)
        .slice(0, limit);

      return new Response(JSON.stringify({ candidates, reasons }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-match error:", e);
    const status = (e as Error).message === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

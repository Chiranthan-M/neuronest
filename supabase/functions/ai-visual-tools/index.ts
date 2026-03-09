import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type VisualTool = "generate_image" | "generate_diagram" | "generate_mindmap";

const systemPrompts: Record<VisualTool, string> = {
  generate_image:
    "You are an image generation assistant. Generate an image based on the user's description. Apply the requested style.",
  generate_diagram:
    `You are a diagram generator. Given a topic or process, create a Mermaid.js diagram. Return ONLY valid Mermaid syntax wrapped in \`\`\`mermaid code block. Supported types: flowchart (graph TD/LR), sequence, class, state. Use clear labels. Do NOT add any explanation outside the code block. Keep node labels short (max 4 words). Use simple ASCII characters only in labels - no special characters, parentheses in labels, or quotes within node text.`,
  generate_mindmap:
    `You are a mind map generator. Given a topic, create a structured mind map. Return ONLY a valid JSON object with this exact structure: {"topic":"Main Topic","branches":[{"label":"Branch 1","children":[{"label":"Sub 1"},{"label":"Sub 2"}]},{"label":"Branch 2","children":[{"label":"Sub 3"}]}]}. Generate 4-6 main branches with 2-4 children each. No markdown, no explanation, ONLY the JSON.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, content, style } = await req.json();

    if (!tool || !systemPrompts[tool as VisualTool]) {
      return new Response(JSON.stringify({ error: "Invalid tool type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Image generation uses the image model
    if (tool === "generate_image") {
      const styleText = style ? `Style: ${style}. ` : "Style: illustration. ";
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `${styleText}Generate an image: ${content}`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("AI image error:", response.status, errText);
        throw new Error("AI image generation error");
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const text = data.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ result: text, imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Diagram and mind map use text model
    let userMessage = content;
    if (tool === "generate_diagram" && style) {
      userMessage = `Diagram type: ${style}. Topic: ${content}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompts[tool as VisualTool] },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI visual error:", response.status, errText);
      throw new Error("AI visual tool error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-visual-tools error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

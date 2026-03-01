import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ToolType =
  | "summarize"
  | "improve_writing"
  | "change_tone"
  | "plagiarism_check"
  | "smart_tags"
  | "productivity_analytics"
  | "translate"
  | "ocr";

const systemPrompts: Record<ToolType, string> = {
  summarize:
    "You are a concise summarizer. Summarize the following text into 2-4 clear bullet points. Return only the summary, no preamble.",
  improve_writing:
    "You are an expert writing editor. Improve the following text for clarity, grammar, and readability. Keep the same meaning and approximate length. Return only the improved text.",
  change_tone:
    "You are a tone specialist. Rewrite the following text in the requested tone. Maintain the original meaning. Return only the rewritten text.",
  plagiarism_check:
    "You are an originality analyst. Analyze the following text and provide: 1) An originality score from 0-100 (100 = fully original), 2) Any phrases that seem commonly used or potentially unoriginal, 3) Suggestions for making the text more unique. Format as: Score: X/100 then Analysis then Suggestions.",
  smart_tags:
    'You are a tag generator. Analyze the following text and suggest 3-6 relevant tags. Return ONLY a JSON array of tag strings like ["tag1","tag2"]. No other text.',
  productivity_analytics:
    "You are a productivity analyst. Given the following note data (JSON with titles, categories, dates, counts), provide a brief productivity analysis: 1) Writing patterns, 2) Most productive times/categories, 3) One actionable tip. Keep it under 150 words.",
  translate:
    "You are a professional translator. Translate the following text to the requested target language. Auto-detect the source language. Return ONLY the translated text, no explanations or preamble.",
  ocr:
    "You are an OCR and handwriting recognition specialist. Extract ALL text visible in this image, including handwritten text, printed text, scribbles, and text in any language. Preserve the original structure and formatting as much as possible. If text is in multiple languages, extract all of them. Return ONLY the extracted text, no explanations.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tool, content, tone, notesData, targetLang } = await req.json();

    if (!tool || !systemPrompts[tool as ToolType]) {
      return new Response(JSON.stringify({ error: "Invalid tool type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userMessage = content || "";
    if (tool === "change_tone" && tone) {
      userMessage = `Tone: ${tone}\n\nText: ${content}`;
    }
    if (tool === "translate" && targetLang) {
      userMessage = `Target language: ${targetLang}\n\nText: ${content}`;
    }
    if (tool === "productivity_analytics" && notesData) {
      userMessage = JSON.stringify(notesData);
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompts[tool as ToolType] },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tools error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

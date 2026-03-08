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
  | "ocr"
  | "autocomplete"
  | "autocorrect"
  | "rewrite"
  | "expand"
  | "simplify";

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
    "You are a professional translator. Translate the following text to the requested target language. Auto-detect the source language. If a translation style is specified, adapt the register, vocabulary, and sentence structure accordingly: Standard = neutral balanced translation, Formal = polished respectful language, Casual = relaxed conversational tone, Professional = business-appropriate precise wording, Academic = scholarly precise terminology. Return ONLY the translated text, no explanations or preamble.",
  ocr:
    "You are an OCR and handwriting recognition specialist. Extract ALL text visible in this image, including handwritten text, printed text, scribbles, and text in any language. Preserve the original structure and formatting as much as possible. If text is in multiple languages, extract all of them. Return ONLY the extracted text, no explanations.",
  autocomplete:
    "You are a writing autocomplete assistant. Given the text so far, predict the most natural continuation. Return ONLY the completion text (the new words/sentence to append), NOT the original text. Keep it to 1 short sentence or a few words. Be contextually relevant. Return nothing if the text seems complete.",
  autocorrect:
    'You are a grammar and spelling checker. Analyze the text and return ONLY a valid JSON object: {"corrections":[{"original":"misspelled or wrong phrase","corrected":"fixed version","reason":"brief explanation"}]}. Only flag actual errors in spelling, grammar, or punctuation. If no errors found, return {"corrections":[]}. No markdown, no extra text.',
  rewrite:
    "You are a writing assistant. Rewrite the following text to be clearer and more polished while keeping the same meaning. Return ONLY the rewritten text.",
  expand:
    "You are a writing assistant. Expand the following text with more detail, examples, and elaboration while maintaining the original tone and meaning. Return ONLY the expanded text.",
  simplify:
    "You are a writing assistant. Simplify the following text to be easier to understand. Use shorter sentences and simpler words while keeping the meaning. Return ONLY the simplified text.",
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
      const styleInstruction = tone ? `Translation style: ${tone}. ` : "";
      userMessage = `${styleInstruction}Target language: ${targetLang}\n\nText: ${content}`;
    }
    if (tool === "productivity_analytics" && notesData) {
      userMessage = JSON.stringify(notesData);
    }

    // For OCR, use vision-capable model with image
    const isOCR = tool === "ocr" && content && content.startsWith("data:image");
    const messages: any[] = [
      { role: "system", content: systemPrompts[tool as ToolType] },
    ];

    if (isOCR) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Extract all text from this image, including handwritten text in any language." },
          { type: "image_url", image_url: { url: content } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userMessage });
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
          model: isOCR ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
          messages,
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

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StreamChatOptions {
  model: string;
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}

export async function streamChat({
  model,
  systemPrompt,
  messages,
  maxTokens = 4096,
}: StreamChatOptions) {
  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  return stream;
}

export async function generateCompletion({
  model,
  systemPrompt,
  userPrompt,
  maxTokens = 8192,
}: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}) {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

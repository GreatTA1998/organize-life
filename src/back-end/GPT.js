import OpenAI from "openai";
const client = new OpenAI({
  apiKey: import.meta.env.VITE_PUBLIC_BROWSER_NAME,
  dangerouslyAllowBrowser: true,
});
import { systemPrompt } from "./prompt.js";

async function chat({ tasksJSON, templatesJSON, chat }) {
  const messages = [
    {
      role: "system",
      content: `${systemPrompt} Respond in html format, include html tags like <h4> or <ul> or <li>. Do not use markdown like # or * or any other markdown formatting. user tasks:${tasksJSON}, user Templates:${templatesJSON}`,
    },
    ...chat,
  ];
  const response = await client.chat.completions
    .create({ model: "gpt-4o-2024-08-06", messages: messages })
    .catch((err) => {
      console.error("error in GPT.chat: ", err);
    });
  return response.choices[0].message;
}

export default { chat };

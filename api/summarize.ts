// api/summarize.ts
import { Groq } from 'groq-sdk';
import { Ollama } from 'ollama';
import { generateText } from 'ai';

export const config = {
  runtime: 'edge',
};

const customPrompt = `
  당신은 카카오톡 대화 내용을 분석하고 요약하는 전문가입니다.

  1. 성격 및 말투: 어떤 성격을 가지고 있으며, 주로 어떤 말투(예: 다정함, 유머러스함, 직설적임 등)를 사용하는지
  2. 특별한 습관: 대화 중에 나타나는 독특한 습관이나 패턴(예: 이모티콘 사용, 특정 단어 반복 등)이 있다면 설명해주세요.
  3. 관계 역학: 각각의 사용자들이 대화에서 어떤 역할을 하는지(예: 리더십, 서포터 등)와 그 이유를 분석해주세요.
  결과는 친근하고 다정한 말투로, 블로그 글처럼 자연스럽게 작성해주세요.
  결과는 마크다운 형식을 사용하지 말고, 순수한 텍스트로만 요약해주세요.
`;

export default async function handler(req: Request) {
  const { messages }: ChatRequest = await req.json();

  // Add the custom system prompt as the first message
  const processedMessages: VercelChatMessage[] = [
    {
      role: 'system',
      content: customPrompt,
    },
    ...messages,
  ];
  
  // Check if running on Vercel or locally
  if (process.env.VERCEL_ENV) {
    // VERCEL DEPLOYMENT: Use Groq API
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response('Groq API key is not configured.', { status: 500 });
    }
    const groq = new Groq({ apiKey: groqApiKey });

    try {
      const { text } = await generateText({
        model: "llama3.1-70b-8192",
        prompt: messages
      });
      console.log(text);
      return text
    } catch (error) {
      console.error('Groq API error:', error);
      return new Response('Error from Groq API.', { status: 500 });
    }
  } else {
    // LOCAL DEVELOPMENT: Use Ollama
    try {
      const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

      const responseStream = await ollama.chat({
        model: 'llama3.1', // The model to use with Ollama
        messages: processedMessages,
        stream: true,
      });

      // Convert Ollama's stream to a format compatible with Vercel AI SDK
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of responseStream) {
            controller.enqueue(chunk.message.content);
          }
          controller.close();
        },
      });

      return new StreamingTextResponse(stream);
    } catch (error) {
      console.error('Ollama API error:', error);
      return new Response(
        'Error from Ollama API. \n\n- Is the Ollama application running? \n- Have you pulled the model? (e.g., `ollama pull llama3.1`)',
        { status: 500 }
      );
    }
  }
}

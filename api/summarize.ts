// api/summarize.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const generationConfig = {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function generateSummary(messages: string, user: string): Promise<string> {
    const prompt = `
      당신은 연인의 카카오톡 대화 내용을 분석하는 전문가입니다.
      아래는 특정 사용자 '${user}'의 메시지 모음입니다.
      
      [대화 내용]
      ${messages}
      [대화 내용 끝]
      
      위 대화 내용을 바탕으로 '${user}'라는 사람의 특징을 친구에게 설명해주듯이 친근한 말투로 요약해주세요.
      다음 항목들을 반드시 포함해서 분석하고, 자연스러운 문장으로 연결해주세요.
      
      1.  **성격 및 말투:** 어떤 성격을 가지고 있으며, 주로 어떤 말투(예: 다정함, 유머러스함, 직설적임 등)를 사용하는지 분석해주세요.
      2.  **대화 스타일:** 질문을 많이 하는 편인지, 대답을 많이 하는 편인지, 혹은 대화를 주도하는 편인지 설명해주세요.
      3.  **감정 표현:** 애정, 고마움, 미안함 등의 감정을 얼마나 자주, 어떻게 표현하는지 구체적인 예시를 들어 설명해주세요.
      4.  **주요 관심사:** 대화에서 자주 언급하는 주제나 관심사가 무엇인지 파악해주세요.
      
      결과는 마크다운 형식을 사용하지 말고, 순수한 텍스트로만 요약해주세요.
    `;

    const parts = [{ text: prompt }];

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        const response = result.response;
        if (response.promptFeedback?.blockReason) {
            console.warn('Prompt was blocked:', response.promptFeedback.blockReason);
            return `'${user}'님의 대화 내용 분석 중 문제가 발생했습니다. (사유: ${response.promptFeedback.blockReason})`;
        }
        
        return response.text();
    } catch (error) {
        console.error("Error generating summary from Gemini:", error);
        throw new Error("AI 요약 생성에 실패했습니다.");
    }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  const { messages } = req.body;
  
  if (!messages || typeof messages !== 'string') {
    return res.status(400).json({ error: '"messages" is required in the request body and must be a string.' });
  }

  // Extract user from the first line of messages, assuming format "[timestamp] user: message"
  const firstLine = messages.split('\n')[0];
  const userMatch = firstLine.match(/\]\s(.*?):/);
  const user = userMatch ? userMatch[1].trim() : '해당 사용자';

  try {
    const summary = await generateSummary(messages, user);
    return res.status(200).json({ summary });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: `Failed to generate summary. ${errorMessage}` });
  }
}

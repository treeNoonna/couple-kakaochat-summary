import { GoogleGenerativeAI } from '@google/generative-ai'

export type ChatMessageInput = {
  role?: 'user' | 'assistant' | string
  content?: string
}

export type SummarizeRequestBody = {
  messages?: ChatMessageInput[]
  text?: string
  user?: string
}

export function buildPrompt(user: string, conversationText: string) {
  return [
    `다음 카카오톡 대화를 바탕으로 ${user}님의 말투와 대화 흐름을 한국어로 요약해줘.`,
    '반드시 다음 규칙을 지켜줘:',
    '- 5~8문장 정도로 간결하게 정리해줘.',
    '- 감정, 자주 언급한 주제, 대화 분위기를 포함해줘.',
    '- 과장하지 말고 대화 내용에 근거해서만 써줘.',
    '- 필요하면 마지막에 한 줄로 재미있는 한마디를 덧붙여도 좋아.',
    '',
    '대화 내용:',
    conversationText,
  ].join('\n')
}

export function extractConversationText(body: SummarizeRequestBody) {
  const textFromBody = body.text?.trim()
  if (textFromBody) {
    return textFromBody
  }

  return (body.messages ?? [])
    .map((message) => message.content?.trim())
    .filter((content): content is string => Boolean(content))
    .join('\n')
}

export async function summarizeWithGemini(options: {
  apiKey: string
  conversationText: string
  userLabel: string
  modelName?: string
}) {
  const { apiKey, conversationText, userLabel, modelName = 'gemini-1.5-flash' } = options
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName })
  const prompt = buildPrompt(userLabel, conversationText)

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text().trim()
}

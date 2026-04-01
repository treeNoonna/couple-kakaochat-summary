import type { VercelRequest, VercelResponse } from '@vercel/node'
import { extractConversationText, summarizeWithGemini, type SummarizeRequestBody } from '../server/gemini-summary'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.',
    })
  }

  const body = req.body as SummarizeRequestBody | undefined
  const conversationText = body ? extractConversationText(body) : ''

  if (!conversationText) {
    return res.status(400).json({ error: '요약할 대화 내용이 없습니다.' })
  }

  const userLabel = body?.user?.trim() || '선택한 사용자'

  try {
    const text = await summarizeWithGemini({
      apiKey,
      conversationText,
      userLabel,
      modelName: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
    })

    return res.status(200).json({
      text: text || '요약 결과를 생성하지 못했습니다.',
      model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
    })
  } catch (error) {
    console.error('Gemini summarize error:', error)
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Gemini 요약 생성에 실패했습니다.'
    return res.status(500).json({
      error: message,
    })
  }
}

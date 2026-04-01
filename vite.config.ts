import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { summarizeWithGemini, type SummarizeRequestBody } from './server/gemini-summary'

function summarizeApiPlugin() {
  return {
    name: 'summarize-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.method !== 'POST' || req.url !== '/api/summarize') {
          next()
          return
        }

        try {
          let rawBody = ''
          req.on('data', (chunk: Buffer) => {
            rawBody += chunk.toString('utf8')
          })

          req.on('end', async () => {
            try {
              const env = loadEnv(server.config.mode, process.cwd(), '')
              const apiKey = env.GEMINI_API_KEY
              const modelName = env.GEMINI_MODEL || 'gemini-1.5-flash'

              if (!apiKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' }))
                return
              }

              const body = rawBody ? (JSON.parse(rawBody) as SummarizeRequestBody) : {}
              const conversationText = body ? (body.text?.trim() || '') : ''
              const messagesText = conversationText || (body.messages ?? [])
                .map((message) => message.content?.trim())
                .filter((content): content is string => Boolean(content))
                .join('\n')

              if (!messagesText) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: '요약할 대화 내용이 없습니다.' }))
                return
              }

              const text = await summarizeWithGemini({
                apiKey,
                conversationText: messagesText,
                userLabel: body.user?.trim() || '선택한 사용자',
                modelName,
              })

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ text: text || '요약 결과를 생성하지 못했습니다.', model: modelName }))
            } catch (error) {
              console.error('Vite summarize api error:', error)
              const message =
                error instanceof Error && error.message
                  ? error.message
                  : 'Gemini 요약 생성에 실패했습니다.'
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: message }))
            }
          })
        } catch (error) {
          console.error('Vite summarize middleware error:', error)
          next(error)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), summarizeApiPlugin()],
    publicDir: 'public',
  }
})

import type { VercelRequest, VercelResponse } from '@vercel/node'
import JSZip from 'jszip'

export const config = {
  api: {
    bodyParser: false, // formData 사용을 위해 비활성화
  },
}

async function parseFormData(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = await parseFormData(req)
    
    // multipart/form-data에서 파일 추출
    const contentType = req.headers['content-type'] || ''
    const boundaryMatch = contentType.match(/boundary=(.+)/)
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Invalid content type' })
    }
    
    const boundary = boundaryMatch[1]
    const parts = body.toString('binary').split(`--${boundary}`)
    
    let zipBuffer: Buffer | null = null
    
    for (const part of parts) {
      if (part.includes('filename=') && part.includes('.zip')) {
        // 파일 데이터 추출 (헤더와 본문 분리)
        const headerEndIndex = part.indexOf('\r\n\r\n')
        if (headerEndIndex !== -1) {
          const fileData = part.slice(headerEndIndex + 4)
          // 마지막 \r\n 제거
          const cleanData = fileData.replace(/\r\n--$/, '').replace(/\r\n$/, '')
          zipBuffer = Buffer.from(cleanData, 'binary')
          break
        }
      }
    }
    
    if (!zipBuffer) {
      return res.status(400).json({ error: 'zip 파일을 찾을 수 없습니다.' })
    }

    // JSZip으로 압축 해제
    const zip = await JSZip.loadAsync(zipBuffer)
    
    // .txt 파일만 필터링
    const txtEntries = Object.values(zip.files).filter(
      entry => !entry.dir && entry.name.toLowerCase().endsWith('.txt')
    )
    
    if (txtEntries.length === 0) {
      return res.status(400).json({ error: 'zip 파일 안에 .txt 파일이 없습니다.' })
    }
    
    // 모든 txt 파일 내용 읽기
    const fileContents = await Promise.all(
      txtEntries.map(entry => entry.async('string'))
    )
    
    const combinedContent = fileContents.join('\n\n')
    
    return res.status(200).json({ content: combinedContent })
  } catch (error) {
    console.error('Unzip error:', error)
    return res.status(500).json({ 
      error: 'zip 파일 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

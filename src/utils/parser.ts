import type { ChatMessage, ChatStats, AnalysisResult } from '../types/chat'

// 카카오톡 텍스트 파일 파싱 함수
export function parseChatFile(content: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  const lines = content.split('\n')
  
  // 카카오톡 메시지 패턴 (여러 형식 지원)
  // 형식 1: 2025. 5. 18. 오전 9:26, 이름 : 메시지
  // 형식 2: 2024년 1월 1일 오후 3:30, 이름 : 메시지
  const pattern1 = /^(\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.\s*(?:오전|오후)\s*\d{1,2}:\d{2}),\s*(.+?)\s*:\s*(.+)$/
  const pattern2 = /^(\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*(?:오전|오후)\s*\d{1,2}:\d{2}),\s*(.+?)\s*:\s*(.+)$/
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // 두 가지 패턴 모두 시도
    let match = trimmedLine.match(pattern1) || trimmedLine.match(pattern2)
    
    if (match) {
      const [, timestamp, sender, message] = match
      messages.push({
        timestamp,
        sender: sender.trim(),
        message: message.trim()
      })
    }
  }
  
  return messages
}

// 채팅 통계 계산
// 참고: React.cache()는 Next.js의 서버 컴포넌트(RSC)에서만 사용 가능하며,
// 클라이언트 사이드 앱에서는 useMemo() 같은 클라이언트 최적화 기법을 사용합니다.
export function calculateStats(messages: ChatMessage[], keywords: string[]): AnalysisResult {
  const stats: ChatStats = {
    totalMessages: messages.length,
    messagesByUser: new Map(),
    keywordsByUser: new Map()
  }
  
  const usersSet = new Set<string>()
  
  // 메시지 수 계산 및 키워드 분석 - 단일 루프로 최적화 (best practice: js-combine-iterations)
  for (const msg of messages) {
    const { sender, message } = msg
    usersSet.add(sender)
    
    // 메시지 카운트
    stats.messagesByUser.set(sender, (stats.messagesByUser.get(sender) || 0) + 1)
    
    // 키워드 분석
    if (keywords.length > 0) {
      if (!stats.keywordsByUser.has(sender)) {
        stats.keywordsByUser.set(sender, new Map())
      }
      
      const userKeywords = stats.keywordsByUser.get(sender)!
      const lowerMessage = message.toLowerCase()
      
      for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase()
        // 단순 포함 검색 (단어 경계 무시)
        const count = (lowerMessage.match(new RegExp(lowerKeyword, 'g')) || []).length
        if (count > 0) {
          userKeywords.set(keyword, (userKeywords.get(keyword) || 0) + count)
        }
      }
    }
  }
  
  return {
    stats,
    messages,
    users: Array.from(usersSet)
  }
}

// 비중 계산 헬퍼 함수
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0'
  return ((value / total) * 100).toFixed(1)
}

import type { ChatMessage, ChatStats, AnalysisResult } from '../types/chat'

// URL 패턴 감지 정규식
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+/i;

// 공유/링크 관련 메시지 패턴 (쿠팡, 배민 등)
const SHARE_PATTERNS = [
  /\[쿠팡\s*로켓\s*선물\]/i,           // [쿠팡 로켓 선물]
  /link\.coupang\.com/i,               // 쿠팡 링크
  /님이\s*선물을\s*보냈습니다/i,        // OO님이 선물을 보냈습니다
  /배송지를\s*입력/i,                   // 배송지를 입력
  /쿠팡을\s*추천합니다/i,               // 쿠팡을 추천합니다
  /\[배달의민족\]/i,                    // [배달의민족]
  /baemin\.me/i,                        // 배민 링크
  /toss\.me/i,                          // 토스 링크
  /kakaopay/i,                          // 카카오페이
  /naverpay/i,                          // 네이버페이
];

// URL 또는 공유 메시지인지 확인
export function isUrlMessage(message: string): boolean {
  // URL 패턴 체크
  if (URL_PATTERN.test(message)) {
    return true;
  }
  
  // 공유/링크 관련 메시지 패턴 체크
  for (const pattern of SHARE_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }
  
  return false;
}

// 카카오톡 텍스트 파일 파싱 함수
export function parseChatFile(content: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  const lines = content.split('\n')
  
  // 카카오톡 메시지 패턴 (여러 형식 지원)
  // 형식 1: 2025. 5. 18. 오전 9:26, 이름 : 메시지
  // 형식 2: 2024년 1월 1일 오후 3:30, 이름 : 메시지
  // 형식 3: 2025-01-01 오전 9:26, 이름 : 메시지 (일부 모바일 내보내기)
  const pattern1 = /^(\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.\s*(?:오전|오후)\s*\d{1,2}:\d{2}),\s*(.+?)\s*:\s*(.+)$/
  const pattern2 = /^(\d{4}년\s*\d{1,2}월\s*\d{1,2}일\s*(?:오전|오후)\s*\d{1,2}:\d{2}),\s*(.+?)\s*:\s*(.+)$/
  const pattern3 = /^(\d{4}-\d{1,2}-\d{1,2}\s*(?:오전|오후)\s*\d{1,2}:\d{2}),\s*(.+?)\s*:\s*(.+)$/
  
  let currentMessage: ChatMessage | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    // 세 가지 패턴 모두 시도
    let match = trimmedLine.match(pattern1) || 
                trimmedLine.match(pattern2) || 
                trimmedLine.match(pattern3)
    
    if (match) {
      // 이전 메시지가 있다면 저장
      if (currentMessage) {
        messages.push(currentMessage)
      }
      
      const [, timestamp, sender, message] = match
      currentMessage = {
        timestamp: timestamp.trim(),
        sender: sender.trim(),
        message: message.trim()
      }
    } else if (currentMessage && trimmedLine) {
      // 여러 줄 메시지의 경우 이어붙이기
      currentMessage.message += '\n' + trimmedLine
    }
  }
  
  // 마지막 메시지 저장
  if (currentMessage) {
    messages.push(currentMessage)
  }

  return messages
}

// 채팅 통계 계산
// 클라이언트 사이드 앱에서는 useMemo() 같은 클라이언트 최적화 기법을 사용합니다.
export function calculateStats(messages: ChatMessage[], keywords: string[]): AnalysisResult {
  // URL 메시지 필터링
  const filteredMessages = messages.filter(msg => !isUrlMessage(msg.message));
  
  const stats: ChatStats = {
    totalMessages: filteredMessages.length,
    messagesByUser: new Map(),
    keywordsByUser: new Map()
  }
  
  const usersSet = new Set<string>()
  
  // 메시지 수 계산 및 키워드 분석 - 단일 루프로 최적화 (best practice: js-combine-iterations)
  for (const msg of filteredMessages) {
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
    messages: filteredMessages, // 필터링된 메시지만 반환
    users: Array.from(usersSet)
  }
}

// 비중 계산 헬퍼 함수
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0'
  return ((value / total) * 100).toFixed(1)
}

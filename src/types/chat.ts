export interface ChatMessage {
  timestamp: string
  sender: string
  message: string
}

export interface ChatStats {
  totalMessages: number
  messagesByUser: Map<string, number>
  keywordsByUser: Map<string, Map<string, number>>
}

export interface AnalysisResult {
  stats: ChatStats
  messages: ChatMessage[]
  users: string[]
}

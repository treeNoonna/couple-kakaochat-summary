import { useState, useMemo, memo } from 'react'
import type { AnalysisResult } from '../types/chat'
import { calculatePercentage } from '../utils/parser'

interface ChatAnalysisProps {
  analysis: AnalysisResult
  onReset: () => void
}

// best practice: rerender-memo - 메모이제이션으로 최적화
const UserStatsCard = memo(function UserStatsCard({ 
  user, 
  messageCount, 
  totalMessages 
}: { 
  user: string
  messageCount: number
  totalMessages: number 
}) {
  const percentage = calculatePercentage(messageCount, totalMessages)
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 sm:p-6 rounded-3xl shadow-lg shadow-pink-500/20 border-2 border-pink-500 hover:shadow-xl hover:shadow-pink-500/40 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">💝</span>
        <h3 className="font-bold text-lg sm:text-xl text-pink-400">{user}</h3>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm sm:text-base text-gray-400 font-medium">메시지</span>
        <span className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          {messageCount}개
        </span>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2 font-medium">
          <span>대화 비중</span>
          <span className="font-bold text-pink-400">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
})

export default function ChatAnalysis({ analysis, onReset }: ChatAnalysisProps) {
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  
  // best practice: rerender-derived-state - 파생 상태 계산
  const keywordStats = useMemo(() => {
    if (keywords.length === 0) return null
    
    const stats = new Map<string, Map<string, number>>()
    
    // best practice: js-set-map-lookups - Set으로 O(1) 검색
    const keywordSet = new Set(keywords.map(k => k.toLowerCase()))
    
    for (const msg of analysis.messages) {
      const lowerMessage = msg.message.toLowerCase()
      
      for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase()
        if (!keywordSet.has(lowerKeyword)) continue
        
        const count = (lowerMessage.match(new RegExp(lowerKeyword, 'g')) || []).length
        if (count > 0) {
          if (!stats.has(msg.sender)) {
            stats.set(msg.sender, new Map())
          }
          const userStats = stats.get(msg.sender)!
          userStats.set(keyword, (userStats.get(keyword) || 0) + count)
        }
      }
    }
    
    return stats
  }, [keywords, analysis.messages])
  
  // 선택된 키워드가 포함된 메시지 필터링
  const filteredMessages = useMemo(() => {
    if (!selectedKeyword) return []
    
    const lowerKeyword = selectedKeyword.toLowerCase()
    
    return analysis.messages.filter(msg => {
      // 사용자 필터가 있으면 해당 사용자만
      if (selectedUser && msg.sender !== selectedUser) return false
      
      return msg.message.toLowerCase().includes(lowerKeyword)
    })
  }, [selectedKeyword, selectedUser, analysis.messages])
  
  // best practice: rerender-functional-setstate - 함수형 업데이트로 안정적인 콜백
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed])
      setKeywordInput('')
    }
  }
  
  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword))
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKeyword()
    }
  }
  
  const handleKeywordClick = (keyword: string, user?: string) => {
    setSelectedKeyword(keyword)
    setSelectedUser(user || null)
  }
  
  const handleCloseMessageList = () => {
    setSelectedKeyword(null)
    setSelectedUser(null)
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-xl shadow-pink-500/20 p-5 sm:p-6 border-2 border-pink-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <span>💕</span>
            <span>분석 결과</span>
          </h1>
          <button
            onClick={onReset}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-500/50 active:scale-95 transform text-sm sm:text-base"
          >
            다시 분석하기 🔄
          </button>
        </div>
        <div className="space-y-2 text-sm sm:text-base">
          <p className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">총 메시지:</span>
            <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {analysis.stats.totalMessages}개
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">참여자:</span>
            <span className="font-bold text-pink-400">{analysis.users.join(' & ')}</span>
          </p>
        </div>
      </div>
      
      {/* 사용자별 통계 */}
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-xl shadow-purple-500/20 p-5 sm:p-6 border border-purple-500/30">
        <h2 className="text-xl sm:text-2xl font-bold text-pink-400 mb-4 sm:mb-5 flex items-center gap-2">
          <span>💖</span>
          <span>우리의 대화 비중</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {Array.from(analysis.stats.messagesByUser.entries()).map(([user, count]) => (
            <UserStatsCard 
              key={user}
              user={user}
              messageCount={count}
              totalMessages={analysis.stats.totalMessages}
            />
          ))}
        </div>
      </div>
      
      {/* 키워드 분석 */}
      <div className="bg-gray-900 bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-xl shadow-pink-500/20 p-5 sm:p-6 border border-pink-500/30">
        <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-4 sm:mb-5 flex items-center gap-2">
          <span>💗</span>
          <span>키워드 분석</span>
        </h2>
        
        {/* 키워드 입력 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="키워드 입력 (예: 사랑, 보고싶어)"
            className="flex-1 px-4 py-3 sm:py-3.5 bg-gray-800 border-2 border-pink-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-sm sm:text-base placeholder-gray-500 text-white"
          />
          <button
            onClick={handleAddKeyword}
            className="px-5 sm:px-7 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-500/50 active:scale-95 transform text-sm sm:text-base"
          >
            추가
          </button>
        </div>
        
        {/* 키워드 목록 */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {keywords.map(keyword => (
              <span
                key={keyword}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-pink-400 rounded-full font-medium border border-pink-500 text-sm sm:text-base shadow-lg shadow-pink-500/30"
              >
                <span>💕</span>
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="text-pink-400 hover:text-pink-300 font-bold ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* 키워드 통계 */}
        {keywordStats && keywords.length > 0 ? (
          <div className="space-y-4">
            {analysis.users.map(user => {
              const userKeywords = keywordStats.get(user)
              return (
                <div key={user} className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-5 rounded-2xl border border-purple-500/50 shadow-lg shadow-purple-500/20">
                  <h3 className="font-bold text-base sm:text-lg text-pink-400 mb-3 flex items-center gap-2">
                    <span>💝</span>
                    {user}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    {keywords.map(keyword => {
                      const count = userKeywords?.get(keyword) || 0
                      return (
                        <button
                          key={keyword}
                          onClick={() => handleKeywordClick(keyword, user)}
                          className="bg-gray-900 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-lg hover:shadow-pink-500/50 hover:bg-gray-800 transition-all cursor-pointer text-left active:scale-95 transform border border-pink-500/30"
                          disabled={count === 0}
                        >
                          <div className="text-xs sm:text-sm text-gray-400 font-medium mb-1">{keyword}</div>
                          <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            {count}회
                          </div>
                          {count > 0 && (
                            <div className="text-[10px] sm:text-xs text-pink-400 mt-1 font-medium">탭하여 메시지 보기 💕</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12">
            <div className="text-5xl sm:text-6xl mb-3">💭</div>
            <p className="text-gray-400 font-medium text-sm sm:text-base">
              키워드를 추가해서 분석을 시작해보세요
            </p>
          </div>
        )}
      </div>
      
      {/* 키워드 메시지 목록 모달 */}
      {selectedKeyword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col border-4 border-pink-200">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 p-5 sm:p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                    <span>💕</span>
                    <span>"{selectedKeyword}"</span>
                  </h2>
                  {selectedUser && (
                    <p className="text-sm opacity-95 flex items-center gap-1">
                      <span>💝</span>
                      <span>{selectedUser}님의 메시지</span>
                    </p>
                  )}
                  <p className="text-sm font-bold mt-2 flex items-center gap-1">
                    <span>💬</span>
                    <span>{filteredMessages.length}개의 메시지</span>
                  </p>
                </div>
                <button
                  onClick={handleCloseMessageList}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-gradient-to-br from-gray-900 to-gray-800">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg, index) => (
                  <div 
                    key={index}
                    className="bg-gray-800 p-4 rounded-2xl hover:shadow-md hover:shadow-pink-500/30 transition-all border border-pink-500/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-pink-400 flex items-center gap-1 text-sm sm:text-base">
                        <span>💝</span>
                        {msg.sender}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                      {/* 키워드 하이라이트 */}
                      {msg.message.split(new RegExp(`(${selectedKeyword})`, 'gi')).map((part, i) => (
                        part.toLowerCase() === selectedKeyword.toLowerCase() ? (
                          <mark key={i} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold px-1.5 py-0.5 rounded">
                            {part}
                          </mark>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      ))}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl sm:text-6xl mb-3">😢</div>
                  <p className="text-gray-400 font-medium">메시지를 찾을 수 없어요</p>
                </div>
              )}
            </div>
            
            {/* 푸터 */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 flex justify-end">
              <button
                onClick={handleCloseMessageList}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold rounded-2xl hover:from-pink-500 hover:to-purple-500 transition-all shadow-md active:scale-95 transform text-sm sm:text-base"
              >
                닫기 💕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

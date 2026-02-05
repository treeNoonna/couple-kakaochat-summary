import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import ChatAnalysis from './components/ChatAnalysis'
import LoadingAnimation from './components/LoadingAnimation'
import { parseChatFile, calculateStats } from './utils/parser'
import type { AnalysisResult } from './types/chat'

export default function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // best practice: rerender-functional-setstate - 안정적인 콜백
  const handleFileUpload = useCallback(async (content: string) => {
    setIsLoading(true)
    
    // 로딩 애니메이션이 보이도록 약간의 딜레이 추가
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      // 파일 파싱
      const messages = parseChatFile(content)
      
      // best practice: js-early-exit - 조기 리턴
      if (messages.length === 0) {
        alert('유효한 카카오톡 대화 내용이 없습니다.\n\n파일 형식을 확인해주세요.')
        return
      }
      
      // 통계 계산 (큰 파일의 경우 시간이 걸릴 수 있음)
      const result = calculateStats(messages, [])
      setAnalysis(result)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const handleReset = useCallback(() => {
    setAnalysis(null)
  }, [])
  
  return (
    <div className="min-h-screen py-6 px-4 sm:py-8 sm:px-6">
      {isLoading && <LoadingAnimation />}
      
      {/* 배경 하트 장식 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-10 left-10 text-4xl animate-pulse" style={{ animationDelay: '0s' }}>💕</div>
        <div className="absolute top-20 right-16 text-3xl animate-pulse" style={{ animationDelay: '0.5s' }}>💝</div>
        <div className="absolute bottom-32 left-20 text-5xl animate-pulse" style={{ animationDelay: '1s' }}>💗</div>
        <div className="absolute bottom-20 right-24 text-4xl animate-pulse" style={{ animationDelay: '1.5s' }}>💖</div>
        <div className="absolute top-1/3 right-1/4 text-3xl animate-pulse" style={{ animationDelay: '2s' }}>💓</div>
      </div>
      
      {analysis ? (
        <ChatAnalysis analysis={analysis} onReset={handleReset} />
      ) : (
        <FileUpload onFileUpload={handleFileUpload} />
      )}
      
      <footer className="mt-12 text-center text-pink-400 text-sm font-medium">
        <p className="flex items-center justify-center gap-2">
          <span>💕</span>
          <span>카카오톡 대화 분석기</span>
          <span>💕</span>
        </p>
        <p className="text-xs text-pink-300 mt-2">Made with Love</p>
      </footer>
    </div>
  )
}

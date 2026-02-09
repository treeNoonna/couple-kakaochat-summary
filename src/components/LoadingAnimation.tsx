export default function LoadingAnimation() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl shadow-pink-500/50 p-8 sm:p-10 text-center border-4 border-pink-500 max-w-sm mx-4">
        {/* 하트 애니메이션 */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6">
          {/* 메인 하트 */}
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <svg className="w-24 h-24 sm:w-32 sm:h-32 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          
          {/* 주변 하트들 */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
            <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.5s' }}>
            <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
        
        {/* 로딩 텍스트 */}
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
          대화 분석 중...
        </h3>
        <p className="text-pink-300 text-sm sm:text-base font-medium mb-1">
          우리의 특별한 이야기를 정리하고 있어요 💖
        </p>
        <p className="text-purple-300 text-sm sm:text-base font-medium">
          정리하고 있어요 💕
        </p>
        
        {/* 로딩 바 */}
        <div className="mt-6 w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar shadow-lg" />
        </div>
        
        {/* 귀여운 메시지 */}
        <p className="mt-4 text-xs text-gray-400">잠시만 기다려주세요 💗</p>
      </div>
    </div>
  )
}

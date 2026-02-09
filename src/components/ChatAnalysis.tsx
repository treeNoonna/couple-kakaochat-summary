import { useState, useMemo, memo, useRef } from 'react'
import type { AnalysisResult } from '../types/chat'
import { calculatePercentage } from '../utils/parser'
import { PieChart, Pie, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import html2canvas from 'html2canvas'

interface ChatAnalysisProps {
  analysis: AnalysisResult
  onReset: () => void
}

const COLORS = ['#BB86FC', '#CF6679', '#03DAC6', '#FFD700', '#F2B880', '#FF6B9D', '#4ECDC4', '#FFA07A', '#98D8C8', '#F7DC6F'];
const USER_COLORS = ['#BB86FC', '#CF6679']; // 두 사용자용 색상

// 한국어 불용어 목록
const stopwords = new Set([
  // photo, emoji, 이모티콘 제외
  '이', '가', '은', '는', '을', '를', '의', '에', '에서', '으로', '하고', '와', '과', '도', '만', '까지', '부터', '께', '께서', '한테', '에게', '입니다', '습니다', '요', '죠', '그', '저', '이것', '저것', '그것', '있다', '없다', '하다', '되다', '이다', '것', '수', '등', '때', '좀', '더', '잘', '못', '안', '걍', '왜', '또', '뭐', '거', '응', '아니', '근데', '진짜', '너무', '정말', '내가', '너가', '우리', 'ㅋㅋ', 'ㅋㅋㅋ', 'ㅋㅋㅋㅋ', 'ㅎㅎ', 'ㅎㅎㅎ', 'ㅠㅠ', 'ㅜㅜ', "ㅠㅠㅠ"
  ,'사진', '이모티콘',
]);


// best practice: rerender-memo - 메모이제이션으로 최적화
const UserStatsCard = memo(function UserStatsCard({
  user,
  messageCount,
  totalMessages, 
  avgResponseTime
}: {
  user: string
  messageCount: number
  totalMessages: number, 
  avgResponseTime: string
}) {
  const percentage = calculatePercentage(messageCount, totalMessages)
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 sm:p-6 rounded-3xl shadow-lg shadow-pink-500/20 border-2 border-pink-500 hover:shadow-xl hover:shadow-pink-500/40 transition-all h-full flex flex-col justify-between">
      <div>
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
        <div className="mt-4">
        <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2 font-medium">
            <span>평균 답장 속도</span>
            <span className="font-bold text-pink-400">{avgResponseTime}</span>
          </div>
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
  const analysisRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // 평균 답장 속도 계산
  const avgResponseTime = useMemo(() => {
    const parseTimestamp = (timestamp: string): Date | null => {
      // "2025. 11. 9. 오후 11:40" 형식 파싱
      const match = timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
      if (!match) return null;
      
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      const isPM = match[4] === '오후';
      let hour = parseInt(match[5]);
      const minute = parseInt(match[6]);
      
      // 오후/오전 처리
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      
      return new Date(year, month, day, hour, minute);
    };
    
    const responseTimes = new Map<string, number[]>();
    analysis.users.forEach(user => responseTimes.set(user, []));
    
    for (let i = 1; i < analysis.messages.length; i++) {
      const prevMsg = analysis.messages[i - 1];
      const currMsg = analysis.messages[i];
      
      // 발신자가 바뀌었을 때만 답장으로 간주
      if (prevMsg.sender !== currMsg.sender) {
        const prevTime = parseTimestamp(prevMsg.timestamp);
        const currTime = parseTimestamp(currMsg.timestamp);
        
        if (prevTime && currTime) {
          const diffMinutes = (currTime.getTime() - prevTime.getTime()) / (1000 * 60);
          
          // 24시간(1440분) 이내의 답장만 계산 (너무 긴 시간은 제외)
          if (diffMinutes > 0 && diffMinutes <= 1440) {
            responseTimes.get(currMsg.sender)?.push(diffMinutes);
          }
        }
      }
    }
    
    // 평균 계산
    const result = new Map<string, string>();
    analysis.users.forEach(user => {
      const times = responseTimes.get(user) || [];
      if (times.length > 0) {
        const avgMinutes = times.reduce((a, b) => a + b, 0) / times.length;
        
        if (avgMinutes < 60) {
          result.set(user, `${Math.round(avgMinutes)}분`);
        } else if (avgMinutes < 1440) {
          const hours = Math.floor(avgMinutes / 60);
          const mins = Math.round(avgMinutes % 60);
          result.set(user, `${hours}시간 ${mins}분`);
        } else {
          result.set(user, '1일 이상');
        }
      } else {
        result.set(user, '데이터 없음');
      }
    });
    
    return result;
  }, [analysis.messages, analysis.users]);
  
  // 각 사용자별 자주 사용한 단어 분석
  const userWordAnalysis = useMemo(() => {
    const result = new Map<string, { word: string; count: number }[]>();
    
    analysis.users.forEach(user => {
      const userMessages = analysis.messages.filter(msg => msg.sender === user);
      const wordCounts = new Map<string, number>();
      
      for (const msg of userMessages) {
        const words = msg.message.toLowerCase().split(/[\s,.\-!?~"""…]+/);
        
        for (const word of words) {
          if (word && word.length > 1 && !stopwords.has(word)) {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
          }
        }
      }
      
      const sortedWords = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
      
      result.set(user, sortedWords);
    });
    
    return result;
  }, [analysis.messages, analysis.users]);
  
  // 월별 메시지 수 분석
  const monthlyMessageData = useMemo(() => {
    const monthlyData = new Map<string, Map<string, number>>();
    
    for (const msg of analysis.messages) {
      const dateMatch = msg.timestamp.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
      if (dateMatch) {
        const year = dateMatch[1];
        const month = dateMatch[2].padStart(2, '0');
        const monthKey = `${year}.${month}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, new Map());
        }
        
        const monthStats = monthlyData.get(monthKey)!;
        monthStats.set(msg.sender, (monthStats.get(msg.sender) || 0) + 1);
      }
    }
    
    const chartData = Array.from(monthlyData.entries())
      .map(([month, userData]) => {
        const dataPoint: any = { month };
        analysis.users.forEach(user => {
          dataPoint[user] = userData.get(user) || 0;
        });
        return dataPoint;
      })
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return chartData;
  }, [analysis.messages, analysis.users]);

  
  // best practice: rerender-derived-state - 파생 상태 계산
  const keywordStats = useMemo(() => {
    if (keywords.length === 0) return null
    
    const stats = new Map<string, Map<string, number>>()
    
    // best practice: js-set-map-lookups - Set으로 O(1) 검색
    const keywordSet = new Set(keywords.map(k => k.toLowerCase()))
    
    for (const msg of analysis.messages) {
      // 괄호 안의 내용(이모티콘) 제거
      const messageWithoutEmoticons = msg.message.replace(/\([^)]*\)/g, '')
      const lowerMessage = messageWithoutEmoticons.toLowerCase()
      
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
  }, [keywords, analysis.messages]);
  
  // 선택된 키워드가 포함된 메시지 필터링
  const filteredMessages = useMemo(() => {
    if (!selectedKeyword) return []
    
    const lowerKeyword = selectedKeyword.toLowerCase()
    
    return analysis.messages.filter(msg => {
      // 사용자 필터가 있으면 해당 사용자만
      if (selectedUser && msg.sender !== selectedUser) return false
      
      // 괄호 안의 내용(이모티콘) 제거 후 검색
      const messageWithoutEmoticons = msg.message.replace(/\([^)]*\)/g, '')
      return messageWithoutEmoticons.toLowerCase().includes(lowerKeyword)
    })
  }, [selectedKeyword, selectedUser, analysis.messages]);
  
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
    if (e.nativeEvent.isComposing) return;
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
  
  const handleDownloadImage = async () => {
    if (!analysisRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // 키워드 검색 섹션을 제외하고 캡처
      const keywordSection = document.querySelector('[data-exclude-capture]');
      const originalDisplay = keywordSection ? (keywordSection as HTMLElement).style.display : '';
      if (keywordSection) {
        (keywordSection as HTMLElement).style.display = 'none';
      }
      
      // 모바일 여부 확인
      const isMobile = window.innerWidth < 768;
      
      const canvas = await html2canvas(analysisRef.current, {
        backgroundColor: '#0f0f0f',
        scale: isMobile ? 1.5 : 2, // 모바일에서는 scale 낮춤 (메모리 절약)
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      // 원래 상태로 복원
      if (keywordSection) {
        (keywordSection as HTMLElement).style.display = originalDisplay;
      }
      
      // Blob 생성
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.95);
      });
      
      const date = new Date().toISOString().split('T')[0];
      const fileName = `카카오톡_대화분석_${date}.png`;
      
      // 모바일에서 Web Share API 사용 가능한 경우
      if (isMobile && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          const shareData = {
            files: [file],
            title: '카카오톡 대화 분석',
            text: '우리의 대화 분석 결과입니다!'
          };
          
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return; // 공유 성공 시 다운로드 스킵
          }
        } catch (err: any) {
          // 공유 취소하거나 실패하면 다운로드로 fallback
          if (err.name === 'AbortError') {
            console.log('공유가 취소되었습니다.');
            return;
          }
        }
      }
      
      // 일반 다운로드 (데스크톱 또는 공유 불가능한 경우)
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      // 모바일에서 성공 피드백
      if (isMobile) {
        alert('이미지가 저장되었습니다! 📸');
      }
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div ref={analysisRef} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-xl shadow-pink-500/20 p-5 sm:p-6 border-2 border-pink-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <span>💕</span>
            <span>분석 결과</span>
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-2xl hover:from-purple-600 hover:to-blue-600 transition-all shadow-md shadow-purple-500/50 active:scale-95 transform text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isDownloading ? '저장 중...' : (
                <>
                  <span className="hidden sm:inline">이미지 저장 📸</span>
                  <span className="sm:hidden">저장 📸</span>
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-500/50 active:scale-95 transform text-sm sm:text-base whitespace-nowrap"
            >
              <span className="hidden sm:inline">다시 분석 🔄</span>
              <span className="sm:hidden">다시 🔄</span>
            </button>
          </div>
        </div>
        <div className="space-y-2 text-sm sm:text-base mb-6">
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
        
        {/* 사용자 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-6">
          {Array.from(analysis.stats.messagesByUser.entries()).map(([user, count]) => (
            <div key={user}>
              <UserStatsCard 
                user={user}
                messageCount={count}
                totalMessages={analysis.stats.totalMessages}
                avgResponseTime={avgResponseTime.get(user) || '데이터 없음'}
              />
            </div>
          ))}
        </div>
        
        
        {/* 자주 사용한 단어 */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>자주 사용한 단어</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.users.map((user) => {
              const topWords = userWordAnalysis.get(user) || [];
              const chartData = topWords.map((item, idx) => ({
                name: item.word,
                value: item.count,
                fill: COLORS[idx % COLORS.length]
              }));
              
              return (
                <div key={user} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <h3 className="text-base font-bold text-pink-400 mb-4 text-center">{user}님</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent, cx, cy, midAngle, outerRadius}) =>  {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 60;
                            const x = (cx as number) + radius * Math.cos(-(midAngle || 0) * RADIAN);
                            const y = (cy as number) + radius * Math.sin(-(midAngle || 0) * RADIAN);
                            return (
                              <text x={x} y={y} 
                                fill="white" 
                                textAnchor={x > cx ? 'start' : 'end'} 
                                dominantBaseline="auto" 
                                style={{ fontSize: '11px' }}
                              >
                                { `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 월별 메시지 추이 */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>월별 메시지</span>
          </h2>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyMessageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="month"
                    stroke="#BBB"
                    tick={{ fill: '#BBB', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#BBB"
                    tick={{ fill: '#BBB' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 30, 30, 0.9)',
                      borderColor: '#555',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#BBB' }} />
                  {analysis.users.map((user, index) => (
                    <Line
                      key={user}
                      type="monotone"
                      dataKey={user}
                      stroke={USER_COLORS[index % USER_COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* 키워드 검색 */}
      <div data-exclude-capture className="bg-gray-900 bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-xl shadow-pink-500/20 p-5 sm:p-6 border border-pink-500/30">
        <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-4 sm:mb-5 flex items-center gap-2">
          <span>💗</span>
          <span>키워드 검색</span>
        </h2>
        
        {/* 키워드 입력 */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="키워드 입력"
            className="flex-1 px-4 py-3 sm:py-3.5 bg-gray-800 border-2 border-pink-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-sm sm:text-base placeholder-gray-500 text-white"
          />
          <button
            onClick={handleAddKeyword}
            className="w-full sm:w-auto px-5 sm:px-7 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-500/50 active:scale-95 transform text-sm sm:text-base"
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

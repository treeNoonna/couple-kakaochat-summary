import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ChatAnalysis from '../components/ChatAnalysis';
import type { AnalysisResult } from '../types/chat';

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    location.state?.analysis || null
  );

  useEffect(() => {
    // location.state에 데이터가 없으면 localStorage에서 복원 시도
    if (!analysis) {
      try {
        const savedData = localStorage.getItem('kakao_analysis');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          
          // Map 객체로 복원
          const restoredAnalysis: AnalysisResult = {
            stats: {
              totalMessages: parsed.stats.totalMessages,
              messagesByUser: new Map(parsed.stats.messagesByUser),
              keywordsByUser: new Map(
                parsed.stats.keywordsByUser.map(([user, keywords]: [string, any[]]) => 
                  [user, new Map(keywords)]
                )
              )
            },
            messages: parsed.messages,
            users: parsed.users
          };
          
          setAnalysis(restoredAnalysis);
          console.log('localStorage에서 분석 데이터 복원 성공');
        }
      } catch (e) {
        console.error('localStorage 복원 실패:', e);
      }
    }
  }, [analysis]);

  const handleReset = () => {
    // localStorage 초기화
    localStorage.removeItem('kakao_analysis');
    navigate('/');
  };

  if (!analysis) {
    // If there's no analysis data, redirect to the home page.
    return <Navigate to="/" replace />;
  }

  return <ChatAnalysis analysis={analysis} onReset={handleReset} />;
}

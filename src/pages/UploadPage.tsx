import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import LoadingAnimation from '../components/LoadingAnimation';
import { parseChatFile, calculateStats } from '../utils/parser';

export default function UploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = useCallback(async (content: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const messages = parseChatFile(content);
      
      if (messages.length === 0) {
        alert('유효한 카카오톡 대화 내용이 없습니다.\n\n파일 형식을 확인해주세요.');
        return;
      }
      
      const result = calculateStats(messages, []);
      
      // localStorage에 저장 (새로고침 시에도 유지)
      try {
        localStorage.setItem('kakao_analysis', JSON.stringify({
          stats: {
            totalMessages: result.stats.totalMessages,
            messagesByUser: Array.from(result.stats.messagesByUser.entries()),
            keywordsByUser: Array.from(result.stats.keywordsByUser.entries()).map(([user, keywords]) => 
              [user, Array.from(keywords.entries())]
            )
          },
          messages: result.messages,
          users: result.users,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn(e);
      }
      
      navigate('/analysis', { state: { analysis: result } });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <>
      {isLoading && <LoadingAnimation />}
      <FileUpload onFileUpload={handleFileUpload} />
    </>
  );
}

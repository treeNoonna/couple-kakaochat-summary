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

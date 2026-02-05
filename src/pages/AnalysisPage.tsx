import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import ChatAnalysis from '../components/ChatAnalysis';
import type { AnalysisResult } from '../types/chat';

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const analysis = location.state?.analysis as AnalysisResult | undefined;

  const handleReset = () => {
    navigate('/');
  };

  if (!analysis) {
    // If there's no analysis data, redirect to the home page.
    return <Navigate to="/" replace />;
  }

  return <ChatAnalysis analysis={analysis} onReset={handleReset} />;
}

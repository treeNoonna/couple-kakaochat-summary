import { Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';

export default function App() {
  return (
    <div className="min-h-screen py-6 px-4 sm:py-8 sm:px-6">
      {/* 배경 하트 장식 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-10 left-10 text-4xl animate-pulse" style={{ animationDelay: '0s' }}>💕</div>
        <div className="absolute top-20 right-16 text-3xl animate-pulse" style={{ animationDelay: '0.5s' }}>💝</div>
        <div className="absolute bottom-32 left-20 text-5xl animate-pulse" style={{ animationDelay: '1s' }}>💗</div>
        <div className="absolute bottom-20 right-24 text-4xl animate-pulse" style={{ animationDelay: '1.5s' }}>💖</div>
        <div className="absolute top-1/3 right-1/4 text-3xl animate-pulse" style={{ animationDelay: '2s' }}>💓</div>
      </div>
      
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
      
      <footer className="mt-12 text-center text-pink-400 text-sm font-medium">
        <p className="flex items-center justify-center gap-2">
          <span>💕</span>
          <span>카카오톡 대화 분석기</span>
          <span>💕</span>
        </p>
        <p className="text-xs text-pink-300 mt-2">Made with Love</p>
      </footer>
    </div>
  );
}

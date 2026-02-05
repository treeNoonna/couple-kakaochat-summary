import React from 'react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string | null;
  isLoading: boolean;
  user: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary, isLoading, user }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl shadow-pink-500/20 p-6 sm:p-8 border border-pink-500/30 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-pink-400 mb-4 flex items-center gap-3">
          <span>🧠</span>
          <span>{user}님 대화 분석</span>
        </h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
          </div>
        ) : (
          <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
            {summary}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default SummaryModal;

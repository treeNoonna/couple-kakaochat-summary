import React from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';

export interface UserAnalysis {
  topWords: { word: string; count: number }[];
}

interface UserAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: string | null;
  analysis: UserAnalysis | null;
}

const COLORS = ['#BB86FC', '#CF6679', '#03DAC6', '#FFD700', '#F2B880'];

const UserAnalysisModal: React.FC<UserAnalysisModalProps> = ({ isOpen, onClose, user, analysis }) => {
  if (!isOpen || !analysis || !user) {
    return null;
  }

  const chartData = analysis.topWords.map((item, index) => ({ 
    name: item.word, 
    value: item.count,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl shadow-purple-500/20 p-6 sm:p-8 border border-purple-500/30 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
          <span>{user}님 대화 요약</span>
        </h3>
        
        <div className="space-y-6">
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
            <h4 className="text-lg font-bold text-gray-200 mb-4 text-center">자주 사용한 단어 TOP 5</h4>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(30, 30, 30, 0.8)', 
                      borderColor: '#555',
                      borderRadius: '10px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default UserAnalysisModal;

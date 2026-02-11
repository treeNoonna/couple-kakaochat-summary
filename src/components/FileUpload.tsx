import { useCallback } from 'react'

interface FileUploadProps {
  onFileUpload: (content: string) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const readTxtFile = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file, 'UTF-8')
    })
  }, [])

  // best practice: rerender-functional-setstate - 안정적인 콜백
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const content = await readTxtFile(file)
      onFileUpload(content)
    } catch (error) {
      alert('파일 읽기 중 오류가 발생했습니다.')
      console.error(error)
    }
  }, [onFileUpload, readTxtFile])

  // 폴더 업로드 처리
  const handleFolderChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    // .txt 파일만 필터링 (best practice: js-early-exit)
    const txtFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.txt'))
    
    if (txtFiles.length === 0) {
      alert('폴더 내에 .txt 파일이 없습니다.')
      return
    }
    
    // 모든 파일 읽기 (best practice: async-parallel - Promise.all 사용)
    try {
      const fileContents = await Promise.all(
        txtFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsText(file, 'UTF-8')
          })
        })
      )
      
      // 모든 파일 내용을 합침
      const combinedContent = fileContents.join('\n\n')
      onFileUpload(combinedContent)
    } catch (error) {
      alert('파일 읽기 중 오류가 발생했습니다.')
      console.error(error)
    }
  }, [onFileUpload])
  
  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
      {/* 헤더 */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="text-6xl sm:text-7xl mb-4 animate-pulse-soft">💕</div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 drop-shadow-lg">
          카카오톡 채팅 요약 
        </h1>
        <p className="text-pink-300 text-sm sm:text-base font-medium">
          카카오톡 채팅 내역을 분석해보세요 ✨
        </p>
      </div>
      
      {/* 단일 파일 업로드 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-pink-500 hover:border-pink-400 transition-all mb-4 sm:mb-6 hover:shadow-pink-500/50">
        <label htmlFor="file-upload" className="cursor-pointer block">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl mb-4">💝</div>
            <p className="text-lg sm:text-xl font-bold text-pink-400 mb-2">
              채팅 파일 선택하기
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mb-6">
              카카오톡 .txt 파일을 업로드해주세요
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <button 
            type="button"
            className="w-full py-4 sm:py-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-base sm:text-lg rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg shadow-pink-500/50 active:scale-95 transform"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <span className="flex items-center justify-center gap-2">
              <span>📄</span>
              <span>파일 선택하기</span>
              <span>💕</span>
            </span>
          </button>
        </label>
      </div>
      
      {/* 폴더 업로드 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-purple-500 hover:border-purple-400 transition-all hover:shadow-purple-500/50">
        <div className="block">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl mb-4">💖</div>
            <p className="text-lg sm:text-xl font-bold text-purple-400 mb-2">
              모든 메시지 도큐멘트 한번에 업로드
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mb-6">
              폴더 안의 모든 .txt 파일을 분석해요
            </p>
          </div>
          <input
            id="folder-upload"
            type="file"
            /* @ts-ignore - webkitdirectory is not in TypeScript definitions */
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFolderChange}
            className="hidden"
          />
          <button 
            type="button"
            className="w-full py-4 sm:py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/50 active:scale-95 transform"
            onClick={() => document.getElementById('folder-upload')?.click()}
          >
            <span className="flex items-center justify-center gap-2">
              <span>📂</span>
              <span>폴더 선택하기</span>
              <span>💗</span>
            </span>
          </button>
        </div>
      </div>
      
      {/* 사용 방법 */}
      <div className="mt-6 sm:mt-8 bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-pink-500/30">
        <p className="font-bold text-pink-400 mb-3 flex items-center gap-2 text-sm sm:text-base">
          <span>💡</span>
          <span>사용 방법</span>
        </p>
        <ol className="space-y-2 text-xs sm:text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="font-bold min-w-[20px]">1.</span>
            <span>카카오톡 채팅방 설정 → 대화 내용 내보내기</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold min-w-[20px]">2.</span>
            <span>텍스트 파일(.txt)로 저장하기 or<br/>
            모든 메시지 도큐멘트로 저장 후 압축 해제</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold min-w-[20px]">3.</span>
            <span>위 버튼을 눌러 업로드하기</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold min-w-[20px]">4.</span>
            <span>우리의 특별한 대화 분석 결과 확인! 💕</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

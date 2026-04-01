import { useEffect } from 'react'

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  summary: string | null
  isLoading: boolean
  user: string
}

export default function SummaryModal({
  isOpen,
  onClose,
  summary,
  isLoading,
  user,
}: SummaryModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-br from-gray-950 to-gray-900 shadow-2xl shadow-pink-500/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-pink-300">AI 대화 요약</p>
              <h3 className="mt-1 text-2xl font-bold text-white">
                {user}님 요약
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              aria-label="요약 모달 닫기"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
          {isLoading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-pink-500/20 border-t-pink-400" />
              <div>
                <p className="text-lg font-bold text-white">AI가 대화를 읽고 있어요</p>
                <p className="mt-2 text-sm text-gray-400">
                  대화의 분위기와 핵심 내용을 요약하는 중입니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-pink-500/20 bg-white/5 p-4">
                <p className="text-sm font-semibold text-pink-300">요약 결과</p>
                <p className="mt-2 whitespace-pre-wrap break-words leading-8 text-gray-100">
                  {summary || '요약 결과가 아직 없습니다.'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-sm leading-7 text-gray-400">
                <p className="font-semibold text-gray-200">안내</p>
                <p className="mt-2">
                  이 요약은 해당 사용자의 메시지만 바탕으로 생성됩니다. 요약 결과는 대화 내용이 길거나
                  표현이 반복될수록 더 자연스럽게 나옵니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

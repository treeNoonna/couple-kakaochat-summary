/* import { collection, addDoc, getDoc, doc } from 'firebase/firestore'
import { db } from './firebase'
import type { AnalysisResult } from '../types/chat'

// 분석 결과를 저장하고 공유 ID 생성
export async function saveAnalysisForSharing(analysis: AnalysisResult): Promise<string> {
  try {
    // Firestore에 데이터 A
    const docRef = await addDoc(collection(db, 'sharedAnalysis'), {
      analysis: {
        stats: {
          totalMessages: analysis.stats.totalMessages,
          messagesByUser: Object.fromEntries(analysis.stats.messagesByUser),
          keywordsByUser: Object.fromEntries(
            Array.from(analysis.stats.keywordsByUser.entries()).map(([user, keywords]) => [
              user,
              Object.fromEntries(keywords)
            ])
          )
        },
        messages: analysis.messages,
        users: analysis.users
      },
      createdAt: new Date().toISOString(),
      // 30일 후 자동 삭제를 위한 타임스탬프
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error saving analysis:', error)
    throw new Error('분석 결과 저장에 실패했습니다.')
  }
}

// 공유 ID로 분석 결과 불러오기
export async function loadSharedAnalysis(shareId: string): Promise<AnalysisResult | null> {
  try {
    const docRef = doc(db, 'sharedAnalysis', shareId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    const data = docSnap.data()
    
    // 만료 확인
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return null
    }
    
    // Map 객체로 변환
    const analysis: AnalysisResult = {
      stats: {
        totalMessages: data.analysis.stats.totalMessages,
        messagesByUser: new Map(Object.entries(data.analysis.stats.messagesByUser)),
        keywordsByUser: new Map(
          Object.entries(data.analysis.stats.keywordsByUser).map(([user, keywords]) => [
            user,
            new Map(Object.entries(keywords as Record<string, number>))
          ])
        )
      },
      messages: data.analysis.messages,
      users: data.analysis.users
    }
    
    return analysis
  } catch (error) {
    console.error('Error loading shared analysis:', error)
    return null
  }
}
 */
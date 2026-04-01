# 💕 우리의 대화 요약

카카오톡 대화 내용을 분석하여 메시지 비중과 키워드를 확인할 수 있는 커플 앱입니다.

## ✨ 주요 기능

- 📁 **파일/폴더 업로드**: 단일 파일 또는 여러 대화 파일 한번에 업로드
- 📊 **월별 메세지 분석**: 월별 메세지 갯수 차트 확인
- 💬 **메시지 검색**: 특정 단어를 누가 몇 번 말했는지 분석 & 키워드가 포함된 실제 대화 내용 확인

## 🚀 기술 스택

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Performance**: Vercel React Best Practices 적용

## 🤖 AI 요약 설정

AI 요약 기능은 서버 환경변수 `GEMINI_API_KEY`를 사용합니다.

로컬 실행 또는 Vercel 배포 환경에 아래 값을 설정하세요.

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (선택, 기본값: `gemini-1.5-flash`)

## 💻 로컬 실행

### 의존성 설치
npm install

### 개발 서버 실행
npm run dev

### vercel 개발서버 실행 
npx vercel dev

### 프로덕션 빌드
npm run build


## 📝 사용 방법

1. 카카오톡 대화방에서 **메뉴 → 대화 내보내기**
2. 텍스트 파일(.txt)로 저장
3. 웹사이트에서 파일 또는 폴더 업로드
4. 분석 결과 확인!

로컬에서 `npm run dev`로 실행해도 AI 요약 API가 함께 동작합니다.  
서버 환경변수 `GEMINI_API_KEY`가 없으면 요약은 실패하니, `.env.local` 또는 Vercel 환경설정에 키를 넣어주세요.

## 🎨 디자인

- 다크 테마
- 네온 핑크/퍼플 그라데이션
- Gamja Flower font
- 모바일 최적화

## 📄 라이선스

MIT License

---

Made with 💕

import './globals.css';

export const metadata = {
  title: 'AI 최강도사 | 황성진',
  description: 'AI가 풀어주는 24절기 기반 정밀 사주 상담',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

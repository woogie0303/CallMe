import type { Metadata } from 'next';
import { AppSidebar } from '@/widgets/app-sidebar/ui/app-sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reread — 읽은 문장을 다시 읽는 곳',
  description:
    '원서를 읽다 걸린 표현을 모으고, 리텔링과 퀴즈로 다시 꺼내 보는 서비스.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

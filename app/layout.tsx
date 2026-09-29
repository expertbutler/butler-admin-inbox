import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Butler Inbox',
  description: 'WhatsApp concierge conversations across all hotels',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </body>
    </html>
  );
}

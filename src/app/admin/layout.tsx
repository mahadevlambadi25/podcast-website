import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import '../globals.css';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Unchartered Editorial CMS',
    default: 'Dashboard | Unchartered Editorial CMS',
  },
  description: 'Custom editorial management platform for Unchartered — Legends & Legacies.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-[#F7F3EB] text-slate-800 font-sans antialiased selection:bg-[#C9A24B] selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

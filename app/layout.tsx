import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: 'Deep Down Logistics - Container Inventory',
  description: 'Minimalist container inventory and goods tracking for Deep Down Logistics. Easily view goods inside containers, log items taken away, and export to Excel or PDF.',
  openGraph: {
    title: 'Deep Down Logistics - Container Inventory',
    description: 'Minimalist container inventory and goods tracking for Deep Down Logistics. Easily view goods inside containers, log items taken away, and export to Excel or PDF.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deep Down Logistics - Container Inventory',
    description: 'Minimalist container inventory and goods tracking for Deep Down Logistics. Easily view goods inside containers, log items taken away, and export to Excel or PDF.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'FreightCore - Container & Inventory Management',
  description: 'Enterprise container, shipment, and warehouse inventory management platform with real-time stock-in/out tracking, container-level balance calculation, audit logs, and Excel/PDF reporting.',
  openGraph: {
    title: 'FreightCore - Container & Inventory Management',
    description: 'Enterprise container, shipment, and warehouse inventory management platform with real-time stock-in/out tracking, container-level balance calculation, audit logs, and Excel/PDF reporting.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreightCore - Container & Inventory Management',
    description: 'Enterprise container, shipment, and warehouse inventory management platform with real-time stock-in/out tracking, container-level balance calculation, audit logs, and Excel/PDF reporting.',
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

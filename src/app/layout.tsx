import DeepHeader from '@/components/DeepHeader';
import Footer from '@/components/Footer';
import { InstanceProvider } from '@/contexts/InstanceContext';
import { AuthProvider } from '@/components/AuthProvider';
import './global.css';

export const metadata = {
  title: 'HooYa!',
  // description: '',
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="/config.js" strategy="beforeInteractive" />
      </head>
      <body>
        <AuthProvider>
          <InstanceProvider>
            <DeepHeader />
            {children}
            <Footer />
          </InstanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

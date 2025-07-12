import DeepHeader from '@/components/DeepHeader';
import Footer from '@/components/Footer';
import { InstanceProvider } from '@/contexts/InstanceContext';
import Script from 'next/script';
import './global.css';

export const metadata = {
  title: 'HooYa!',
  // description: '',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Script src="/env.js" strategy="beforeInteractive" />
      <body>
        <InstanceProvider>
          <DeepHeader />
          {children}
          <Footer />
        </InstanceProvider>
      </body>
    </html>
  );
}

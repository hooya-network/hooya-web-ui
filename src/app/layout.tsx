import DeepHeader from '@/components/DeepHeader';
import Footer from '@/components/Footer';
import { InstanceProvider } from '@/contexts/InstanceContext';
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

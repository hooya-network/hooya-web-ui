import DeepHeader from '@/components/DeepHeader'
import './global.css'

export const metadata = {
  title: 'HooYa!',
  // description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
      <DeepHeader/>
      {children}
      </body>
    </html>
  )
}

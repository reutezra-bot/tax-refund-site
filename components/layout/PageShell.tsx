import Header from './Header';
import Footer from './Footer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

interface PageShellProps {
  children: React.ReactNode;
}

export default function PageShell({ children }: PageShellProps) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

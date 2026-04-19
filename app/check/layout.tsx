import { CheckSessionProvider } from '@/lib/check-session';

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <CheckSessionProvider>
      {children}
    </CheckSessionProvider>
  );
}

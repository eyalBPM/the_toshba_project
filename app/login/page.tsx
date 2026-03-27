import { Suspense } from 'react';
import { LoginForm } from '@/ui/components/login-form';

export const metadata = {
  title: 'התחברות - תושב"ע',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-49px)] items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

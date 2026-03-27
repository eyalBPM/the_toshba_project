import { RegisterForm } from '@/ui/components/register-form';

export const metadata = {
  title: 'הרשמה - תושב"ע',
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-49px)] items-center justify-center px-4">
      <RegisterForm />
    </main>
  );
}

import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto mt-24 max-w-sm">
      <h1 className="text-2xl font-bold">Butler Inbox</h1>
      <p className="mt-1 text-sm text-slate-500">Super admins only.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

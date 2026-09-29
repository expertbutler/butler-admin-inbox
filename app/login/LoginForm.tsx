'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    searchParams.get('denied') ? 'That account is not a super admin.' : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.refresh();
    router.push('/');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        aria-label="Email"
        className="rounded border border-slate-300 px-3 py-2"
      />
      <input
        type="password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        aria-label="Password"
        className="rounded border border-slate-300 px-3 py-2"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
};

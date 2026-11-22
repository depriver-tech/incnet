'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from '@/lib/actions';

export function Submit({ children, className = 'btn', pending: pendingText }: { children: React.ReactNode; className?: string; pending?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? <><span className="spinner" aria-hidden /> {pendingText || 'Saving…'}</> : children}
    </button>
  );
}

/** A form bound to a server action that returns { error } or { ok }, shown under the fields. */
export function ActionForm({ action, children, className = 'form-grid', resetOnOk }: { action: (s: FormState, fd: FormData) => Promise<FormState>; children: React.ReactNode; className?: string; resetOnOk?: boolean }) {
  const [state, run] = useActionState(action, undefined);
  return (
    <form action={run} className={className} key={resetOnOk && state?.ok ? String(Math.random()) : undefined}>
      {children}
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      {state?.ok && <p className="notice" role="status">{state.ok}</p>}
    </form>
  );
}

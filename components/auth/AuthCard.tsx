'use client';

import { AlertCircle, ArrowRight, Building2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from '@/lib/actions';

type Field = { name: string; label: string; type?: 'text' | 'email' | 'password'; autoComplete?: string; placeholder?: string; icon: 'mail' | 'lock' | 'user' | 'building'; aside?: React.ReactNode };
const ICONS = { mail: Mail, lock: Lock, user: User, building: Building2 };

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="auth-submit" disabled={pending} aria-busy={pending}>
      {pending ? <span className="auth-spin" aria-label="Please wait" /> : <><span>{children}</span><ArrowRight size={15} /></>}
    </button>
  );
}

function Input({ field, autoFocus }: { field: Field; autoFocus: boolean }) {
  const [show, setShow] = useState(false);
  const Icon = ICONS[field.icon];
  const isPw = field.type === 'password';
  return (
    <div>
      <div className="auth-label-row">
        <label htmlFor={field.name} className="auth-label">{field.label}</label>
        {field.aside}
      </div>
      <div className="auth-input">
        <Icon size={14} className="auth-icon" aria-hidden />
        <input id={field.name} name={field.name} type={isPw && show ? 'text' : field.type || 'text'} autoComplete={field.autoComplete} placeholder={field.placeholder} required autoFocus={autoFocus} minLength={isPw ? 8 : undefined} />
        {isPw && (
          <button type="button" className="auth-eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

/** The incnet sign-in and sign-up card, styled after the Incpritech sign-in page. */
export function AuthCard({ action, fields, submit, children }: { action: (s: FormState, fd: FormData) => Promise<FormState>; fields: Field[]; submit: string; children?: React.ReactNode }) {
  const [state, run] = useActionState(action, undefined);
  return (
    <div className="auth-card">
      {state?.error && (
        <div className="auth-error" role="alert"><AlertCircle size={15} /><span>{state.error}</span></div>
      )}
      <form action={run} className="auth-form">
        {fields.map((f, i) => <Input key={f.name} field={f} autoFocus={i === 0} />)}
        <SubmitButton>{submit}</SubmitButton>
      </form>
      {children}
    </div>
  );
}

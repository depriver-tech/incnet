'use client';

import { ActionForm, Submit } from '@/components/ActionForm';
import type { FormState } from '@/lib/actions';

type Field = { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string };

export function AuthForm({ action, fields, submit }: { action: (s: FormState, fd: FormData) => Promise<FormState>; fields: Field[]; submit: string }) {
  return (
    <ActionForm action={action}>
      {fields.map((f, i) => (
        <label key={f.name} className="field">{f.label}
          <input name={f.name} type={f.type || 'text'} autoComplete={f.autoComplete} placeholder={f.placeholder} required autoFocus={i === 0} minLength={f.type === 'password' ? 8 : undefined} />
        </label>
      ))}
      <Submit className="btn btn-block btn-lg" pending="One moment…">{submit}</Submit>
    </ActionForm>
  );
}

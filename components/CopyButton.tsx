'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyButton({ text, label = 'Copy', className = 'btn btn-sm' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked: the text is still selectable */ }
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? 'Copied' : label}
    </button>
  );
}

export function CodeBox({ code }: { code: string }) {
  return (
    <div className="code">
      <CopyButton text={code} label="Copy script" className="btn btn-sm copy" />
      <pre className="mono">{code}</pre>
    </div>
  );
}

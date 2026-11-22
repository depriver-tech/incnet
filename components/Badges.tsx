export function PayBadge({ status }: { status: string }) {
  const cls = status === 'completed' ? 'ok' : status === 'pending' ? 'warn' : status === 'needs_review' ? 'bad' : '';
  const label = { completed: 'Paid', pending: 'Waiting', failed: 'Failed', expired: 'Expired', needs_review: 'Check' }[status] ?? status;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function AccessBadge({ status }: { status: string }) {
  const cls = status === 'active' ? 'ok' : status === 'unused' ? 'accent' : status === 'revoked' ? 'bad' : '';
  const label = { active: 'In use', unused: 'Unused', expired: 'Expired', revoked: 'Cancelled' }[status] ?? status;
  return <span className={`badge ${cls}`}>{label}</span>;
}

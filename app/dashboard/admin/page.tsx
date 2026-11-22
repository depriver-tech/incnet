import { redirect } from 'next/navigation';

/** The console moved to /admin. */
export default function OldConsole() {
  redirect('/admin');
}

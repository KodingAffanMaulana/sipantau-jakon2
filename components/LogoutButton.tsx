'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 hover:bg-red-600 hover:text-white hover:pointer-events-auto">
      Logout
    </button>
  );
}

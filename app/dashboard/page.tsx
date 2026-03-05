'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

type Role = 'admin' | 'user' | null;

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/login');
        router.refresh();
        return;
      }

      setEmail(data.user.email ?? null);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (error) setRole(null);
      else setRole((profile?.role as Role) ?? null);
    })();
  }, [router]);

  if (!email) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-orange-100">
      {/* Topbar */}
      <header className="border-b bg-orange-500">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-white">SIPANTAU JAKON</h1>
            <p className="text-sm text-slate-100">Dashboard Monitoring</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex rounded-full border bg-slate-50 px-3 py-1 text-sm text-slate-700">
              {email}
            </span>

            <span className="inline-flex rounded-full border bg-white px-3 py-1 text-sm text-slate-700">
              Role: <span className="ml-1 font-semibold text-slate-900">{role ?? '-'}</span>
            </span>

            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7">
        {/* Welcome / Summary */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-sm text-slate-600">
                Pilih pengawasan di bawah untuk melihat rekap dan input data.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge label="Status" value="Aktif" color="green" />
              <Badge
                label="Akses"
                value={role === 'admin' ? 'Admin (Input & Delete)' : 'User (View Only)'}
                color={role === 'admin' ? 'blue' : 'slate'}
              />
            </div>
          </div>

          {/* Menu cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MenuCard
              title="Tertib Usaha"
              desc="Rekapitulasi Pengawasan Tertib Usaha Jasa Konstruksi (BUJK)"
              href="/tertib-usaha"
              tag="Rekap Tahunan"
              accent="blue"
            />

            <MenuCard
              title="Tertib Penyelenggaraan"
              desc="Rekapitulasi Pengawasan Tertib Penyelenggaraan Jasa Konstruksi (Tahunan)"
              href="/penyelenggaraan-tahunan"
              tag="Rekap Tahunan"
              accent="indigo"
            />

            <MenuCard
              title="Tertib Pemanfaatan"
              desc="Modul berikutnya (akan dibuat setelah 2 modul di atas stabil)"
              href="/pemanfaatan"
              tag="Rekap Tahunan"
              accent="slate"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function Badge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'green' | 'blue' | 'slate';
}) {
  const cls =
    color === 'green'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : color === 'blue'
        ? 'bg-blue-50 text-blue-800 border-blue-200'
        : 'bg-slate-50 text-slate-800 border-slate-200';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      <span className="opacity-70">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function MenuCard({
  title,
  desc,
  href,
  tag,
  accent,
  disabled = false,
}: {
  title: string;
  desc: string;
  href: string;
  tag: string;
  accent: 'blue' | 'indigo' | 'slate';
  disabled?: boolean;
}) {
  const accentCls =
    accent === 'blue'
      ? 'from-blue-600 to-sky-500'
      : accent === 'indigo'
        ? 'from-indigo-600 to-violet-500'
        : 'from-slate-600 to-slate-500';

  const cardBase =
    'group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition';

  const interactive = disabled
    ? 'opacity-60 cursor-not-allowed'
    : 'hover:-translate-y-0.5 hover:shadow-md';

  const content = (
    <div className={`${cardBase} ${interactive}`}>
      <div
        className={`absolute right-0 top-0 h-24 w-24 rounded-bl-[40px] bg-gradient-to-br ${accentCls} opacity-15`}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-600">Pengawasan</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{title}</h3>
        </div>

        <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          {tag}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{desc}</p>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span>{disabled ? 'Segera tersedia' : 'Buka Pengawasan'}</span>
        {!disabled && <span className="transition group-hover:translate-x-0.5">→</span>}
      </div>
    </div>
  );

  if (disabled) return <div>{content}</div>;

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

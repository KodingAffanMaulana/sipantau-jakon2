'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Status = 'tertib' | 'belum_tertib';

export default function TambahRekapBujkPage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nib: '',
    nama_badan_usaha: '',
    pjbu: '',
    jenis: 'tertib' as Status,
    sifat: 'tertib' as Status,
    klasifikasi: 'tertib' as Status,
    layanan: 'tertib' as Status,
    bentuk: 'tertib' as Status,
    kualifikasi: 'tertib' as Status,
    sbu: 'tertib' as Status,
    nib_persyaratan: 'tertib' as Status,
    peningkatan_kapasitas_sdm: 'tertib' as Status,
    peningkatan_peralatan: 'tertib' as Status,
    peningkatan_teknologi: 'tertib' as Status,
    peningkatan_kualitas_keuangan: 'tertib' as Status,
    peningkatan_manajemen_usaha: 'tertib' as Status,
  });

  async function loadRoleAndGuard() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    if (!uid) {
      router.push('/login');
      router.refresh();
      return;
    }

    const { data, error } = await supabase.from('profiles').select('role').eq('id', uid).single();

    if (error) {
      setRole(null);
      router.push('/tertib-usaha');
      return;
    }

    const r = (data?.role as any) ?? null;
    setRole(r);

    // guard: kalau bukan admin, balik ke rekap
    if (r !== 'admin') {
      router.push('/tertib-usaha');
      router.refresh();
    }
  }

  useEffect(() => {
    loadRoleAndGuard();
  }, []);

  const statusOptions = useMemo(
    () => [
      { value: 'tertib', label: 'Tertib' },
      { value: 'belum_tertib', label: 'Belum Tertib' },
    ],
    [],
  );

  async function submit() {
    setMsg(null);

    // validasi minimal
    if (!form.nib || !form.nama_badan_usaha || !form.pjbu) {
      setMsg('NIB, Nama Badan Usaha, dan PJBU wajib diisi.');
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    const { error } = await supabase.from('rekap_bujk').insert({
      created_by: uid ?? null,
      ...form,
    });

    setLoading(false);

    if (error) {
      setMsg(`Gagal: ${error.message}`);
      return;
    }

    setMsg('Berhasil ditambahkan.');
    router.push('/tertib-usaha');
    router.refresh();
  }

  // biar tidak “kedip” sebelum role kebaca
  if (role === null) {
    return <div className="min-h-screen bg-slate-100 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-7">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/tertib-usaha" className="text-sm text-blue-700 hover:underline">
              ← Kembali ke Rekap
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Tambah Data - Tertib Usaha Jasa Konstruksi
            </h1>
            <p className="text-sm text-slate-600">
              Input data pengawasan BUJK (status tertib / belum tertib).
            </p>
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 border">
            Role: <span className="font-semibold">{role}</span>
          </span>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Identitas Badan Usaha</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="NIB" value={form.nib} onChange={(v) => setForm({ ...form, nib: v })} />
            <Input
              label="Nama Badan Usaha"
              value={form.nama_badan_usaha}
              onChange={(v) => setForm({ ...form, nama_badan_usaha: v })}
            />
            <Input label="PJBU" value={form.pjbu} onChange={(v) => setForm({ ...form, pjbu: v })} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Group title="Kesesuaian Kegiatan Konstruksi">
              <Select
                label="Jenis"
                value={form.jenis}
                onChange={(v) => setForm({ ...form, jenis: v })}
                options={statusOptions}
              />
              <Select
                label="Sifat"
                value={form.sifat}
                onChange={(v) => setForm({ ...form, sifat: v })}
                options={statusOptions}
              />
              <Select
                label="Klasifikasi"
                value={form.klasifikasi}
                onChange={(v) => setForm({ ...form, klasifikasi: v })}
                options={statusOptions}
              />
              <Select
                label="Layanan"
                value={form.layanan}
                onChange={(v) => setForm({ ...form, layanan: v })}
                options={statusOptions}
              />
            </Group>

            <Group title="Kegiatan Usaha & Segmentasi Pasar">
              <Select
                label="Bentuk"
                value={form.bentuk}
                onChange={(v) => setForm({ ...form, bentuk: v })}
                options={statusOptions}
              />
              <Select
                label="Kualifikasi"
                value={form.kualifikasi}
                onChange={(v) => setForm({ ...form, kualifikasi: v })}
                options={statusOptions}
              />
            </Group>

            <Group title="Pemenuhan Persyaratan Usaha">
              <Select
                label="SBU"
                value={form.sbu}
                onChange={(v) => setForm({ ...form, sbu: v })}
                options={statusOptions}
              />
              <Select
                label="NIB (Persyaratan)"
                value={form.nib_persyaratan}
                onChange={(v) => setForm({ ...form, nib_persyaratan: v })}
                options={statusOptions}
              />
            </Group>

            <Group title="Pengembangan Usaha Berkelanjutan">
              <Select
                label="Peningkatan Kapasitas SDM"
                value={form.peningkatan_kapasitas_sdm}
                onChange={(v) => setForm({ ...form, peningkatan_kapasitas_sdm: v })}
                options={statusOptions}
              />
              <Select
                label="Peningkatan Peralatan"
                value={form.peningkatan_peralatan}
                onChange={(v) => setForm({ ...form, peningkatan_peralatan: v })}
                options={statusOptions}
              />
              <Select
                label="Peningkatan Teknologi"
                value={form.peningkatan_teknologi}
                onChange={(v) => setForm({ ...form, peningkatan_teknologi: v })}
                options={statusOptions}
              />
              <Select
                label="Peningkatan Kualitas Pengelolaan Keuangan"
                value={form.peningkatan_kualitas_keuangan}
                onChange={(v) => setForm({ ...form, peningkatan_kualitas_keuangan: v })}
                options={statusOptions}
              />
              <Select
                label="Peningkatan Manajemen Usaha"
                value={form.peningkatan_manajemen_usaha}
                onChange={(v) => setForm({ ...form, peningkatan_manajemen_usaha: v })}
                options={statusOptions}
              />
            </Group>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={submit}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>

            {msg && <p className="text-sm text-slate-700">{msg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: Status;
  onChange: (v: Status) => void;
  options: { value: Status; label: string }[];
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Status)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20">
        {options.map((opt) => (
          <option key={opt.value ?? 'null'} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

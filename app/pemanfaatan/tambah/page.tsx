'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Status = 'tertib' | 'belum_tertib';
type Role = 'admin' | 'user';

type OptionStatus = {
  value: Status;
  label: string;
};

type FormState = {
  nama_bangunan_konstruksi: string;
  nomor_kontrak_pembangunan: string;
  lokasi: string;
  tanggal_tahun_pembangunan: string;
  tanggal_tahun_pemanfaatan: string;
  umur_konstruksi: string;
  kesesuaian_fungsi: Status;
  kesesuaian_lokasi: Status;
  rencana_umur_konstruksi: Status;
  kapasitas_dan_beban: Status;
  pemeliharaan_bangunan: Status;
  program_pemeliharaan: Status;
};

export default function TambahPemanfaatanPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    nama_bangunan_konstruksi: '',
    nomor_kontrak_pembangunan: '',
    lokasi: '',
    tanggal_tahun_pembangunan: '',
    tanggal_tahun_pemanfaatan: '',
    umur_konstruksi: '',
    kesesuaian_fungsi: 'tertib',
    kesesuaian_lokasi: 'tertib',
    rencana_umur_konstruksi: 'tertib',
    kapasitas_dan_beban: 'tertib',
    pemeliharaan_bangunan: 'tertib',
    program_pemeliharaan: 'tertib',
  });

  async function guardAdmin() {
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
      router.push('/pemanfaatan');
      return;
    }

    const r = (data?.role as Role | null) ?? null;
    setRole(r);

    if (r !== 'admin') {
      router.push('/pemanfaatan');
      router.refresh();
    }
  }

  useEffect(() => {
    void guardAdmin();
  }, []);

  const options = useMemo<OptionStatus[]>(
    () => [
      { value: 'tertib', label: 'Tertib' },
      { value: 'belum_tertib', label: 'Belum Tertib' },
    ],
    [],
  );

  async function submit() {
    setMsg(null);

    if (
      !form.nama_bangunan_konstruksi.trim() ||
      !form.nomor_kontrak_pembangunan.trim() ||
      !form.lokasi.trim()
    ) {
      setMsg('Nama Bangunan, Nomor Kontrak, dan Lokasi wajib diisi.');
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    const payload = {
      created_by: uid ?? null,
      ...form,
      nama_bangunan_konstruksi: form.nama_bangunan_konstruksi.trim(),
      nomor_kontrak_pembangunan: form.nomor_kontrak_pembangunan.trim(),
      lokasi: form.lokasi.trim(),
      tanggal_tahun_pembangunan: form.tanggal_tahun_pembangunan.trim(),
      tanggal_tahun_pemanfaatan: form.tanggal_tahun_pemanfaatan.trim(),
      umur_konstruksi: form.umur_konstruksi.trim(),
    };

    const { error } = await supabase.from('tertib_pemanfaatan').insert(payload);

    setLoading(false);

    if (error) {
      setMsg(`Gagal: ${error.message}`);
      return;
    }

    router.push('/pemanfaatan');
    router.refresh();
  }

  if (role === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-7">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/pemanfaatan" className="text-sm text-blue-700 hover:underline">
              ← Kembali ke Rekap
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Tambah Data - Tertib Pemanfaatan
            </h1>
            <p className="text-sm text-slate-600">Input data pengawasan pemanfaatan.</p>
          </div>

          <span className="rounded-full border bg-white px-3 py-1 text-sm text-slate-700">
            Role: <span className="font-semibold">{role}</span>
          </span>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Identitas Bangunan</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Nama Bangunan Konstruksi"
              value={form.nama_bangunan_konstruksi}
              onChange={(v) => setForm({ ...form, nama_bangunan_konstruksi: v })}
            />
            <Input
              label="Nomor Kontrak (Pembangunan)"
              placeholder="Silahkan isi data"
              value={form.nomor_kontrak_pembangunan}
              onChange={(v) => setForm({ ...form, nomor_kontrak_pembangunan: v })}
            />
            <Input
              label="Lokasi"
              value={form.lokasi}
              onChange={(v) => setForm({ ...form, lokasi: v })}
            />
            <Input
              label="Tanggal & Tahun Pembangunan"
              value={form.tanggal_tahun_pembangunan}
              onChange={(v) => setForm({ ...form, tanggal_tahun_pembangunan: v })}
            />
            <Input
              label="Tanggal & Tahun Pemanfaatan"
              value={form.tanggal_tahun_pemanfaatan}
              onChange={(v) => setForm({ ...form, tanggal_tahun_pemanfaatan: v })}
            />
            <Input
              label="Umur Konstruksi"
              value={form.umur_konstruksi}
              onChange={(v) => setForm({ ...form, umur_konstruksi: v })}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Group title="Fungsi Peruntukannya">
              <Select
                label="Kesesuaian Fungsi"
                value={form.kesesuaian_fungsi}
                onChange={(v) => setForm({ ...form, kesesuaian_fungsi: v })}
                options={options}
              />
              <Select
                label="Kesesuaian Lokasi"
                value={form.kesesuaian_lokasi}
                onChange={(v) => setForm({ ...form, kesesuaian_lokasi: v })}
                options={options}
              />
            </Group>

            <Group title="Rencana Umur & Kapasitas">
              <Select
                label="Rencana umur konstruksi"
                value={form.rencana_umur_konstruksi}
                onChange={(v) => setForm({ ...form, rencana_umur_konstruksi: v })}
                options={options}
              />
              <Select
                label="Kapasitas dan Beban"
                value={form.kapasitas_dan_beban}
                onChange={(v) => setForm({ ...form, kapasitas_dan_beban: v })}
                options={options}
              />
            </Group>

            <Group title="Pemeliharaan Produk Konstruksi">
              <Select
                label="Pemeliharaan bangunan"
                value={form.pemeliharaan_bangunan}
                onChange={(v) => setForm({ ...form, pemeliharaan_bangunan: v })}
                options={options}
              />
              <Select
                label="Program pemeliharaan"
                value={form.program_pemeliharaan}
                onChange={(v) => setForm({ ...form, program_pemeliharaan: v })}
                options={options}
              />
            </Group>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={submit}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60">
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
  placeholder = 'Silahkan isi data',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
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
  options: OptionStatus[];
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Status)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

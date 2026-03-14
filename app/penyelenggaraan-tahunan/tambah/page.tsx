'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Status = 'tertib' | 'belum_tertib' | null;

export default function TambahPenyelenggaraanTahunanPage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    kegiatan_konstruksi: '',
    nomor_kontrak: '',
    nama_bujk: '',

    penerapan_smm_konstruksi: null as Status,

    pemenuhan_penyediaan_peralatan: null as Status,
    penggunaan_material_standar: null as Status,
    penggunaan_produk_dalam_negeri: null as Status,

    pemenuhan_standar_mutu_material: null as Status,
    pemenuhan_standar_teknis_lingkungan: null as Status,
    pemenuhan_standar_k3: null as Status,

    proses_pemilihan_penyedia: null as Status,

    penerapan_standar_kontrak: null as Status,
    penggunaan_tenaga_kerja_bersertifikat: null as Status,
    pemberian_pekerjaan_ke_subpenyedia: null as Status,

    ketersediaan_dokumen_k4: null as Status,
    penerapan_smkk: null as Status,
    kegiatan_antisipasi_kecelakaan: null as Status,
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
      router.push('/penyelenggaraan-tahunan');
      return;
    }

    const r = (data?.role as 'admin' | 'user' | null) ?? null;
    setRole(r);

    if (r !== 'admin') {
      router.push('/penyelenggaraan-tahunan');
      router.refresh();
    }
  }

  useEffect(() => {
    guardAdmin();
  }, []);

  const options = useMemo(
    () => [
      { value: 'tertib' as Status, label: 'Tertib' },
      { value: 'belum_tertib' as Status, label: 'Tidak Tertib' },
      { value: null as Status, label: '-' },
    ],
    [],
  );

  async function submit() {
    setMsg(null);

    if (!form.kegiatan_konstruksi.trim() || !form.nomor_kontrak.trim() || !form.nama_bujk.trim()) {
      setMsg('Kegiatan Konstruksi, Nomor Kontrak, dan Nama BUJK wajib diisi.');
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;

    const { error } = await supabase.from('rekap_penyelenggaraan_tahunan').insert({
      created_by: uid ?? null,
      kegiatan_konstruksi: form.kegiatan_konstruksi.trim(),
      nomor_kontrak: form.nomor_kontrak.trim(),
      nama_bujk: form.nama_bujk.trim(),

      penerapan_smm_konstruksi: form.penerapan_smm_konstruksi,
      pemenuhan_penyediaan_peralatan: form.pemenuhan_penyediaan_peralatan,
      penggunaan_material_standar: form.penggunaan_material_standar,
      penggunaan_produk_dalam_negeri: form.penggunaan_produk_dalam_negeri,
      pemenuhan_standar_mutu_material: form.pemenuhan_standar_mutu_material,
      pemenuhan_standar_teknis_lingkungan: form.pemenuhan_standar_teknis_lingkungan,
      pemenuhan_standar_k3: form.pemenuhan_standar_k3,
      proses_pemilihan_penyedia: form.proses_pemilihan_penyedia,
      penerapan_standar_kontrak: form.penerapan_standar_kontrak,
      penggunaan_tenaga_kerja_bersertifikat: form.penggunaan_tenaga_kerja_bersertifikat,
      pemberian_pekerjaan_ke_subpenyedia: form.pemberian_pekerjaan_ke_subpenyedia,
      ketersediaan_dokumen_k4: form.ketersediaan_dokumen_k4,
      penerapan_smkk: form.penerapan_smkk,
      kegiatan_antisipasi_kecelakaan: form.kegiatan_antisipasi_kecelakaan,
    });

    setLoading(false);

    if (error) {
      setMsg(`Gagal: ${error.message}`);
      return;
    }

    router.push('/penyelenggaraan-tahunan');
    router.refresh();
  }

  if (role === null) {
    return <div className="min-h-screen bg-slate-100 p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-7">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/penyelenggaraan-tahunan" className="text-sm text-blue-700 hover:underline">
              ← Kembali ke Rekap
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Tambah Data - Rekap Tahunan</h1>
            <p className="text-sm text-slate-600">
              Input status tertib / tidak tertib / - sesuai form.
            </p>
          </div>

          <span className="rounded-full border bg-white px-3 py-1 text-sm text-slate-700">
            Role: <span className="font-semibold">{role}</span>
          </span>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Identitas Paket/Kontrak</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Kegiatan Konstruksi (Nama Paket)"
              value={form.kegiatan_konstruksi}
              onChange={(v) => setForm({ ...form, kegiatan_konstruksi: v })}
            />
            <Input
              label="Nomor Kontrak"
              value={form.nomor_kontrak}
              onChange={(v) => setForm({ ...form, nomor_kontrak: v })}
            />
            <Input
              label="Nama BUJK"
              value={form.nama_bujk}
              onChange={(v) => setForm({ ...form, nama_bujk: v })}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Group title="Penerapan Sistem Manajemen Mutu Konstruksi">
              <Select
                label="Penerapan Sistem Manajemen Mutu Konstruksi"
                value={form.penerapan_smm_konstruksi}
                onChange={(v) => setForm({ ...form, penerapan_smm_konstruksi: v })}
                options={options}
              />
            </Group>

            <Group title="Material/Peralatan/Teknologi Konstruksi">
              <Select
                label="Pemenuhan penyediaan peralatan"
                value={form.pemenuhan_penyediaan_peralatan}
                onChange={(v) => setForm({ ...form, pemenuhan_penyediaan_peralatan: v })}
                options={options}
              />
              <Select
                label="Penggunaan material standar (SNI/dll)"
                value={form.penggunaan_material_standar}
                onChange={(v) => setForm({ ...form, penggunaan_material_standar: v })}
                options={options}
              />
              <Select
                label="Produk dalam negeri untuk teknologi/MPK"
                value={form.penggunaan_produk_dalam_negeri}
                onChange={(v) => setForm({ ...form, penggunaan_produk_dalam_negeri: v })}
                options={options}
              />
            </Group>

            <Group title="Sumber Material Konstruksi">
              <Select
                label="Standar mutu material"
                value={form.pemenuhan_standar_mutu_material}
                onChange={(v) => setForm({ ...form, pemenuhan_standar_mutu_material: v })}
                options={options}
              />
              <Select
                label="Standar teknis lingkungan"
                value={form.pemenuhan_standar_teknis_lingkungan}
                onChange={(v) => setForm({ ...form, pemenuhan_standar_teknis_lingkungan: v })}
                options={options}
              />
              <Select
                label="Standar keselamatan & kesehatan kerja (K3)"
                value={form.pemenuhan_standar_k3}
                onChange={(v) => setForm({ ...form, pemenuhan_standar_k3: v })}
                options={options}
              />
            </Group>

            <Group title="Pemilihan Penyedia & Kontrak">
              <Select
                label="Proses pemilihan penyedia jasa"
                value={form.proses_pemilihan_penyedia}
                onChange={(v) => setForm({ ...form, proses_pemilihan_penyedia: v })}
                options={options}
              />
              <Select
                label="Penerapan standar kontrak"
                value={form.penerapan_standar_kontrak}
                onChange={(v) => setForm({ ...form, penerapan_standar_kontrak: v })}
                options={options}
              />
              <Select
                label="Tenaga kerja bersertifikat"
                value={form.penggunaan_tenaga_kerja_bersertifikat}
                onChange={(v) => setForm({ ...form, penggunaan_tenaga_kerja_bersertifikat: v })}
                options={options}
              />
              <Select
                label="Pekerjaan ke subpenyedia jasa"
                value={form.pemberian_pekerjaan_ke_subpenyedia}
                onChange={(v) => setForm({ ...form, pemberian_pekerjaan_ke_subpenyedia: v })}
                options={options}
              />
            </Group>

            <Group title="K4 / SMKK / Antisipasi Kecelakaan">
              <Select
                label="Ketersediaan dokumen K4"
                value={form.ketersediaan_dokumen_k4}
                onChange={(v) => setForm({ ...form, ketersediaan_dokumen_k4: v })}
                options={options}
              />
              <Select
                label="Penerapan SMKK"
                value={form.penerapan_smkk}
                onChange={(v) => setForm({ ...form, penerapan_smkk: v })}
                options={options}
              />
              <Select
                label="Kegiatan antisipasi kecelakaan kerja"
                value={form.kegiatan_antisipasi_kecelakaan}
                onChange={(v) => setForm({ ...form, kegiatan_antisipasi_kecelakaan: v })}
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
        placeholder="Silahkan isi data"
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
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || null) as Status)}
        className={[
          'rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20',
          value === 'tertib'
            ? 'border-emerald-300 text-emerald-700'
            : value === 'belum_tertib'
              ? 'border-rose-300 text-rose-700'
              : 'border-slate-300 text-slate-500',
        ].join(' ')}>
        {options.map((opt, i) => (
          <option key={`${String(opt.value)}-${i}`} value={opt.value ?? ''}>
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

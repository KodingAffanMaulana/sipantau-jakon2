'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Status = 'tertib' | 'belum_tertib' | null;

type Row = {
  id: string;
  no: number | null;

  kegiatan_konstruksi: string;
  nomor_kontrak: string;
  nama_bujk: string;

  penerapan_smm_konstruksi: Status;

  pemenuhan_penyediaan_peralatan: Status;
  penggunaan_material_standar: Status;
  penggunaan_produk_dalam_negeri: Status;

  pemenuhan_standar_mutu_material: Status;
  pemenuhan_standar_teknis_lingkungan: Status;
  pemenuhan_standar_k3: Status;

  proses_pemilihan_penyedia: Status;

  penerapan_standar_kontrak: Status;
  penggunaan_tenaga_kerja_bersertifikat: Status;
  pemberian_pekerjaan_ke_subpenyedia: Status;

  ketersediaan_dokumen_k4: Status;
  penerapan_smkk: Status;
  kegiatan_antisipasi_kecelakaan: Status;
};

function labelStatus(v: Status) {
  if (v === 'tertib') return 'Tertib';
  if (v === 'belum_tertib') return 'Tidak Tertib';
  return '-';
}

function overallStatus(row: Row): 'tertib' | 'belum_tertib' {
  const fields: Status[] = [
    row.penerapan_smm_konstruksi,
    row.pemenuhan_penyediaan_peralatan,
    row.penggunaan_material_standar,
    row.penggunaan_produk_dalam_negeri,
    row.pemenuhan_standar_mutu_material,
    row.pemenuhan_standar_teknis_lingkungan,
    row.pemenuhan_standar_k3,
    row.proses_pemilihan_penyedia,
    row.penerapan_standar_kontrak,
    row.penggunaan_tenaga_kerja_bersertifikat,
    row.pemberian_pekerjaan_ke_subpenyedia,
    row.ketersediaan_dokumen_k4,
    row.penerapan_smkk,
    row.kegiatan_antisipasi_kecelakaan,
  ];

  return fields.some((f) => f === 'belum_tertib') ? 'belum_tertib' : 'tertib';
}

export default function RekapPenyelenggaraanTahunanPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'tertib' | 'belum_tertib'>('all');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadRole() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return setRole(null);

    const { data, error } = await supabase.from('profiles').select('role').eq('id', uid).single();
    if (error) setRole(null);
    else setRole((data?.role as 'admin' | 'user' | null) ?? null);
  }

  async function loadData() {
    setLoading(true);
    setMsg(null);

    const query = q.trim();

    let sb = supabase
      .from('rekap_penyelenggaraan_tahunan')
      .select(
        `id,no,kegiatan_konstruksi,nomor_kontrak,nama_bujk,
         penerapan_smm_konstruksi,
         pemenuhan_penyediaan_peralatan,penggunaan_material_standar,penggunaan_produk_dalam_negeri,
         pemenuhan_standar_mutu_material,pemenuhan_standar_teknis_lingkungan,pemenuhan_standar_k3,
         proses_pemilihan_penyedia,
         penerapan_standar_kontrak,penggunaan_tenaga_kerja_bersertifikat,pemberian_pekerjaan_ke_subpenyedia,
         ketersediaan_dokumen_k4,penerapan_smkk,kegiatan_antisipasi_kecelakaan`,
      )
      .order('no', { ascending: true });

    if (query) {
      sb = sb.or(
        `nama_bujk.ilike.%${query}%,nomor_kontrak.ilike.%${query}%,kegiatan_konstruksi.ilike.%${query}%`,
      );
    }

    const { data, error } = await sb;

    setLoading(false);

    if (error) {
      setMsg(`Gagal load data: ${error.message}`);
      setRows([]);
      return;
    }

    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    loadRole();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r) => overallStatus(r) === filter);
  }, [rows, filter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const tertib = rows.filter((r) => overallStatus(r) === 'tertib').length;
    return { total, tertib, belum: total - tertib };
  }, [rows]);

  async function exportExcel() {
    setMsg(null);
    try {
      const XLSX = await import('xlsx');

      const dataForExcel = filteredRows.map((r, index) => ({
        No: index + 1,
        'Kegiatan Konstruksi (Nama Paket)': r.kegiatan_konstruksi,
        'Nomor Kontrak': r.nomor_kontrak,
        'Nama BUJK': r.nama_bujk,

        'Penerapan SMM Konstruksi': labelStatus(r.penerapan_smm_konstruksi),

        'Peralatan - Pemenuhan penyediaan peralatan': labelStatus(r.pemenuhan_penyediaan_peralatan),
        'Material - Penggunaan material standar': labelStatus(r.penggunaan_material_standar),
        'Teknologi/MPK - Produk dalam negeri': labelStatus(r.penggunaan_produk_dalam_negeri),

        'Sumber Material - Standar mutu material': labelStatus(r.pemenuhan_standar_mutu_material),
        'Sumber Material - Standar teknis lingkungan': labelStatus(
          r.pemenuhan_standar_teknis_lingkungan,
        ),
        'Sumber Material - Standar K3': labelStatus(r.pemenuhan_standar_k3),

        'Proses Pemilihan Penyedia': labelStatus(r.proses_pemilihan_penyedia),

        'Kontrak - Penerapan standar kontrak': labelStatus(r.penerapan_standar_kontrak),
        'Kontrak - Tenaga kerja bersertifikat': labelStatus(
          r.penggunaan_tenaga_kerja_bersertifikat,
        ),
        'Kontrak - Pekerjaan ke subpenyedia': labelStatus(r.pemberian_pekerjaan_ke_subpenyedia),

        'K4 - Ketersediaan dokumen': labelStatus(r.ketersediaan_dokumen_k4),
        'SMKK - Penerapan': labelStatus(r.penerapan_smkk),
        'Antisipasi kecelakaan kerja': labelStatus(r.kegiatan_antisipasi_kecelakaan),

        'Status Keseluruhan': overallStatus(r) === 'tertib' ? 'Tertib' : 'Tidak Tertib',
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Tahunan');

      XLSX.writeFile(
        wb,
        `rekap-penyelenggaraan-tahunan-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (e: any) {
      setMsg(`Gagal export: ${e?.message ?? 'unknown error'}`);
    }
  }

  async function deleteRow(row: Row, displayNo: number) {
    setMsg(null);

    if (role !== 'admin') {
      setMsg('Akses ditolak. Hanya admin yang bisa hapus data.');
      return;
    }

    const ok = window.confirm(
      `Hapus data?\n\nNo: ${displayNo}\nKontrak: ${row.nomor_kontrak}\nBUJK: ${row.nama_bujk}`,
    );
    if (!ok) return;

    const { error } = await supabase
      .from('rekap_penyelenggaraan_tahunan')
      .delete()
      .eq('id', row.id);

    if (error) {
      setMsg(`Gagal hapus: ${error.message}`);
      return;
    }

    setMsg('Data berhasil dihapus.');
    loadData();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-7">
        <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
          ← Kembali ke Dashboard
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Rekapitulasi Pengawasan Tertib Penyelenggaraan Jasa Konstruksi Tahunan
            </h1>
            <p className="text-sm text-slate-600">Search + Filter + Export + Delete (admin).</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border bg-white px-3 py-1 text-sm text-slate-700">
              Role: <span className="font-semibold">{role ?? '-'}</span>
            </span>

            {role === 'admin' && (
              <Link
                href="/penyelenggaraan-tahunan/tambah"
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700">
                + Tambah Data
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Pencarian</div>
            <p className="mt-1 text-xs text-slate-600">Nama BUJK / Nomor Kontrak / Nama Paket</p>

            <div className="mt-3 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="contoh: PT. / 01/KTR/... / Rekonstruksi..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                onClick={loadData}
                className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800">
                Cari
              </button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Filter Status Keseluruhan</div>
            <p className="mt-1 text-xs text-slate-600">
              Tidak tertib jika ada minimal 1 kolom tidak tertib.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill active={filter === 'all'} onClick={() => setFilter('all')}>
                Semua
              </Pill>
              <Pill active={filter === 'tertib'} onClick={() => setFilter('tertib')}>
                Tertib
              </Pill>
              <Pill active={filter === 'belum_tertib'} onClick={() => setFilter('belum_tertib')}>
                Tidak Tertib
              </Pill>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <StatBox label="Total" value={stats.total} />
              <StatBox label="Tertib" value={stats.tertib} />
              <StatBox label="Belum" value={stats.belum} />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Export</div>
            <p className="mt-1 text-xs text-slate-600">
              Export sesuai data yang sedang tampil (search+filter).
            </p>

            <button
              onClick={exportExcel}
              className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow hover:bg-emerald-700">
              Export Excel (.xlsx)
            </button>

            <button
              onClick={loadData}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-50">
              Refresh Data
            </button>
          </div>
        </div>

        {msg && (
          <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-slate-700">{msg}</div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[2100px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-sky-700 text-white">
                  <Th rowSpan={2}>No</Th>
                  <Th rowSpan={2}>Kegiatan Konstruksi (Nama Paket)</Th>
                  <Th rowSpan={2}>Nomor Kontrak</Th>
                  <Th rowSpan={2}>Nama BUJK</Th>
                  <Th rowSpan={2}>Sistem Manajemen Mutu Konstruksi</Th>

                  <Th colSpan={3}>Pengelolaan & Penggunaan Material/Peralatan/Teknologi</Th>
                  <Th colSpan={3}>Pengelolaan & Pemanfaatan Sumber Material</Th>

                  <Th rowSpan={2}>Proses Pemilihan Penyedia Jasa</Th>

                  <Th colSpan={3}>Pengawasan Kontrak Kerja Konstruksi</Th>
                  <Th colSpan={3}>Pengawasan Penerapan Standar K3 & Keberlanjutan</Th>

                  <Th rowSpan={2}>Status</Th>
                  <Th rowSpan={2}>Aksi</Th>
                </tr>

                <tr className="bg-sky-700 text-white">
                  <Th>Pemenuhan Peralatan</Th>
                  <Th>Material Standar</Th>
                  <Th>Produk Dalam Negeri</Th>

                  <Th>Mutu Material</Th>
                  <Th>Teknis Lingkungan</Th>
                  <Th>Standar K3</Th>

                  <Th>Standar Kontrak</Th>
                  <Th>Tenaga Kerja Bersertifikat</Th>
                  <Th>Subpenyedia</Th>

                  <Th>Dokumen K4</Th>
                  <Th>SMKK</Th>
                  <Th>Antisipasi Kecelakaan</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={18} className="p-8 text-center text-slate-600">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredRows.map((r, index) => {
                      const ov = overallStatus(r);
                      const displayNo = index + 1;

                      return (
                        <tr
                          key={r.id}
                          className="transition odd:bg-white even:bg-slate-50 hover:bg-blue-50 text-center">
                          <Td>{displayNo}</Td>
                          <Td className="whitespace-normal text-start">{r.kegiatan_konstruksi}</Td>
                          <Td>{r.nomor_kontrak}</Td>
                          <Td>{r.nama_bujk}</Td>

                          <TdBadge value={r.penerapan_smm_konstruksi} />

                          <TdBadge value={r.pemenuhan_penyediaan_peralatan} />
                          <TdBadge value={r.penggunaan_material_standar} />
                          <TdBadge value={r.penggunaan_produk_dalam_negeri} />

                          <TdBadge value={r.pemenuhan_standar_mutu_material} />
                          <TdBadge value={r.pemenuhan_standar_teknis_lingkungan} />
                          <TdBadge value={r.pemenuhan_standar_k3} />

                          <TdBadge value={r.proses_pemilihan_penyedia} />

                          <TdBadge value={r.penerapan_standar_kontrak} />
                          <TdBadge value={r.penggunaan_tenaga_kerja_bersertifikat} />
                          <TdBadge value={r.pemberian_pekerjaan_ke_subpenyedia} />

                          <TdBadge value={r.ketersediaan_dokumen_k4} />
                          <TdBadge value={r.penerapan_smkk} />
                          <TdBadge value={r.kegiatan_antisipasi_kecelakaan} />

                          <Td>
                            <span
                              className={[
                                'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold',
                                ov === 'tertib'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800',
                              ].join(' ')}>
                              {ov === 'tertib' ? 'Tertib' : 'Tidak Tertib'}
                            </span>
                          </Td>

                          <Td>
                            {role === 'admin' ? (
                              <button
                                onClick={() => deleteRow(r, displayNo)}
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                                Hapus
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </Td>
                        </tr>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={18} className="p-8 text-center text-slate-600">
                          Tidak ada data untuk kriteria ini.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t bg-slate-50 px-4 py-3 text-xs text-slate-500">
            * Di layar kecil, geser tabel ke samping (scroll horizontal).
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-xs font-semibold',
        active
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}>
      {children}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-2 text-center">
      <div className="text-[11px] text-slate-600">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Th({
  children,
  colSpan,
  rowSpan,
}: {
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th
      className="whitespace-nowrap border border-sky-600 px-3 py-2 text-center align-middle font-semibold"
      colSpan={colSpan}
      rowSpan={rowSpan}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`whitespace-nowrap border border-slate-200 px-3 py-2 ${className}`}>
      {children}
    </td>
  );
}

function TdBadge({ value }: { value: Status }) {
  const text = labelStatus(value);
  const isTertib = value === 'tertib';

  return (
    <Td>
      <span
        className={[
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold',
          isTertib
            ? 'bg-emerald-100 text-emerald-800'
            : value === 'belum_tertib'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-slate-100 text-slate-700',
        ].join(' ')}>
        {text}
      </span>
    </Td>
  );
}

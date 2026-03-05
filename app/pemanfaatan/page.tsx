'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Status = 'tertib' | 'belum_tertib' | null;

type Row = {
  id: string;
  no: number | null;

  nama_bangunan_konstruksi: string;
  nomor_kontrak_pembangunan: string;
  lokasi: string;

  tanggal_tahun_pembangunan: string | null;
  tanggal_tahun_pemanfaatan: string | null;
  umur_konstruksi: string | null;

  kesesuaian_fungsi: Status;
  kesesuaian_lokasi: Status;

  rencana_umur_konstruksi: Status;
  kapasitas_dan_beban: Status;

  pemeliharaan_bangunan: Status;
  program_pemeliharaan: Status;
};

function labelStatus(v: Status) {
  if (v === 'tertib') return 'Tertib';
  if (v === 'belum_tertib') return 'Belum Tertib';
  return '-';
}

function overallStatus(row: Row): 'tertib' | 'belum_tertib' {
  const fields: Status[] = [
    row.kesesuaian_fungsi,
    row.kesesuaian_lokasi,
    row.rencana_umur_konstruksi,
    row.kapasitas_dan_beban,
    row.pemeliharaan_bangunan,
    row.program_pemeliharaan,
  ];
  return fields.some((f) => f === 'belum_tertib') ? 'belum_tertib' : 'tertib';
}

export default function TertibPemanfaatanPage() {
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
    else setRole((data?.role as any) ?? null);
  }

  async function loadData() {
    setLoading(true);
    setMsg(null);

    const query = q.trim();

    let sb = supabase
      .from('tertib_pemanfaatan')
      .select(
        `id,no,
         nama_bangunan_konstruksi,nomor_kontrak_pembangunan,lokasi,
         tanggal_tahun_pembangunan,tanggal_tahun_pemanfaatan,umur_konstruksi,
         kesesuaian_fungsi,kesesuaian_lokasi,
         rencana_umur_konstruksi,kapasitas_dan_beban,
         pemeliharaan_bangunan,program_pemeliharaan`,
      )
      .order('no', { ascending: true });

    if (query) {
      sb = sb.or(
        `nama_bangunan_konstruksi.ilike.%${query}%,nomor_kontrak_pembangunan.ilike.%${query}%,lokasi.ilike.%${query}%`,
      );
    }

    const { data, error } = await sb;

    setLoading(false);

    if (error) {
      setMsg(`Gagal load data: ${error.message}`);
      setRows([]);
      return;
    }

    setRows((data ?? []) as any);
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

      const dataForExcel = filteredRows.map((r) => ({
        No: r.no ?? '',
        'Nama Bangunan Konstruksi': r.nama_bangunan_konstruksi,
        'Nomor Kontrak (Pembangunan)': r.nomor_kontrak_pembangunan,
        Lokasi: r.lokasi,
        'Tanggal & Tahun Pembangunan': r.tanggal_tahun_pembangunan ?? '',
        'Tanggal & Tahun Pemanfaatan': r.tanggal_tahun_pemanfaatan ?? '',
        'Umur Konstruksi': r.umur_konstruksi ?? '',

        'Kesesuaian Fungsi': labelStatus(r.kesesuaian_fungsi),
        'Kesesuaian Lokasi': labelStatus(r.kesesuaian_lokasi),

        'Rencana umur konstruksi': labelStatus(r.rencana_umur_konstruksi),
        'Kapasitas dan Beban': labelStatus(r.kapasitas_dan_beban),

        'Pemeliharaan bangunan': labelStatus(r.pemeliharaan_bangunan),
        'Program pemeliharaan': labelStatus(r.program_pemeliharaan),

        'Status Keseluruhan': overallStatus(r),
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tertib Pemanfaatan');

      XLSX.writeFile(wb, `tertib-pemanfaatan-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e: any) {
      setMsg(`Gagal export: ${e?.message ?? 'unknown error'}`);
    }
  }

  async function deleteRow(row: Row) {
    setMsg(null);

    if (role !== 'admin') {
      setMsg('Akses ditolak. Hanya admin yang bisa hapus data.');
      return;
    }

    const ok = window.confirm(
      `Hapus data?\n\nNo: ${row.no ?? '-'}\nNama: ${row.nama_bangunan_konstruksi}\nKontrak: ${row.nomor_kontrak_pembangunan}`,
    );
    if (!ok) return;

    const { error } = await supabase.from('tertib_pemanfaatan').delete().eq('id', row.id);
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
            <h1 className="text-2xl font-bold text-slate-900">Tertib Pemanfaatan</h1>
            <p className="text-sm text-slate-600">
              Rekapitulasi pengawasan pemanfaatan produk konstruksi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 border">
              Role: <span className="font-semibold">{role ?? '-'}</span>
            </span>

            {role === 'admin' && (
              <Link
                href="/pemanfaatan/tambah"
                className="rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700">
                + Tambah Data
              </Link>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Pencarian</div>
            <p className="text-xs text-slate-600 mt-1">Nama Bangunan / Nomor Kontrak / Lokasi</p>

            <div className="mt-3 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="contoh: Rekonstruksi / 01/KTR... / Pesawaran"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                onClick={loadData}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-800">
                Cari
              </button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Filter Status Keseluruhan</div>
            <p className="text-xs text-slate-600 mt-1">
              Belum tertib jika ada minimal 1 kolom belum tertib.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill active={filter === 'all'} onClick={() => setFilter('all')}>
                Semua
              </Pill>
              <Pill active={filter === 'tertib'} onClick={() => setFilter('tertib')}>
                Tertib
              </Pill>
              <Pill active={filter === 'belum_tertib'} onClick={() => setFilter('belum_tertib')}>
                Belum Tertib
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
            <p className="text-xs text-slate-600 mt-1">
              Export sesuai data yang sedang tampil (search+filter).
            </p>

            <button
              onClick={exportExcel}
              className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-white font-semibold shadow hover:bg-emerald-700">
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

        {/* Table */}
        <div className="mt-6 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <Th rowSpan={2}>No</Th>
                  <Th rowSpan={2}>Nama Bangunan Konstruksi</Th>
                  <Th rowSpan={2}>Nomor Kontrak (Pembangunan)</Th>
                  <Th rowSpan={2}>Lokasi</Th>
                  <Th rowSpan={2}>Tanggal & Tahun Pembangunan</Th>
                  <Th rowSpan={2}>Tanggal & Tahun Pemanfaatan</Th>
                  <Th rowSpan={2}>Umur Konstruksi</Th>

                  <Th colSpan={2}>Fungsi Peruntukannya</Th>

                  <Th rowSpan={2}>Rencana umur konstruksi</Th>
                  <Th rowSpan={2}>Kapasitas dan Beban</Th>

                  <Th colSpan={2}>Pemeliharaan produk konstruksi</Th>

                  <Th rowSpan={2}>Status</Th>
                  <Th rowSpan={2}>Aksi</Th>
                </tr>

                <tr className="bg-slate-800 text-white">
                  <Th>Kesesuaian Fungsi</Th>
                  <Th>Kesesuaian Lokasi</Th>

                  <Th>Pemeliharaan bangunan</Th>
                  <Th>Program pemeliharaan</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-slate-600">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredRows.map((r) => {
                      const ov = overallStatus(r);
                      return (
                        <tr
                          key={r.id}
                          className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition">
                          <Td>{r.no ?? '-'}</Td>
                          <Td className="whitespace-normal">{r.nama_bangunan_konstruksi}</Td>
                          <Td>{r.nomor_kontrak_pembangunan}</Td>
                          <Td>{r.lokasi}</Td>
                          <Td>{r.tanggal_tahun_pembangunan ?? '-'}</Td>
                          <Td>{r.tanggal_tahun_pemanfaatan ?? '-'}</Td>
                          <Td>{r.umur_konstruksi ?? '-'}</Td>

                          <TdBadge value={r.kesesuaian_fungsi} />
                          <TdBadge value={r.kesesuaian_lokasi} />

                          <TdBadge value={r.rencana_umur_konstruksi} />
                          <TdBadge value={r.kapasitas_dan_beban} />

                          <TdBadge value={r.pemeliharaan_bangunan} />
                          <TdBadge value={r.program_pemeliharaan} />

                          <Td>
                            <span
                              className={[
                                'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold',
                                ov === 'tertib'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800',
                              ].join(' ')}>
                              {ov === 'tertib' ? 'Tertib' : 'Belum Tertib'}
                            </span>
                          </Td>

                          <Td>
                            {role === 'admin' ? (
                              <button
                                onClick={() => deleteRow(r)}
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
                        <td colSpan={14} className="p-8 text-center text-slate-600">
                          Tidak ada data untuk kriteria ini.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 text-xs text-slate-500 bg-slate-50 border-t">
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
        'rounded-full px-3 py-1 text-xs font-semibold border',
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50',
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
      className="border border-slate-700 px-3 py-2 text-center align-middle font-semibold whitespace-nowrap"
      colSpan={colSpan}
      rowSpan={rowSpan}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`border border-slate-200 px-3 py-2 whitespace-nowrap ${className}`}>
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

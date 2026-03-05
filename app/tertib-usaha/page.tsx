'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type Status = 'tertib' | 'belum_tertib' | null;

type RekapBujkRow = {
  id: string;
  no: number | null;
  nib: string;
  nama_badan_usaha: string;
  pjbu: string;

  jenis: Status;
  sifat: Status;
  klasifikasi: Status;
  layanan: Status;

  bentuk: Status;
  kualifikasi: Status;

  sbu: Status;
  nib_persyaratan: Status;

  peningkatan_kapasitas_sdm: Status;
  peningkatan_peralatan: Status;
  peningkatan_teknologi: Status;
  peningkatan_kualitas_keuangan: Status;
  peningkatan_manajemen_usaha: Status;
};

function labelStatus(v: Status) {
  if (v === 'tertib') return 'Tertib';
  if (v === 'belum_tertib') return 'Belum Tertib';
  return '-';
}

// untuk filter status keseluruhan 1 baris
function overallStatus(row: RekapBujkRow): 'tertib' | 'belum_tertib' {
  const fields: Status[] = [
    row.jenis,
    row.sifat,
    row.klasifikasi,
    row.layanan,
    row.bentuk,
    row.kualifikasi,
    row.sbu,
    row.nib_persyaratan,
    row.peningkatan_kapasitas_sdm,
    row.peningkatan_peralatan,
    row.peningkatan_teknologi,
    row.peningkatan_kualitas_keuangan,
    row.peningkatan_manajemen_usaha,
  ];

  // kalau ada minimal 1 "belum_tertib", anggap keseluruhan belum tertib
  return fields.some((f) => f === 'belum_tertib') ? 'belum_tertib' : 'tertib';
}

export default function RekapBujkPage() {
  const [rows, setRows] = useState<RekapBujkRow[]>([]);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  const [q, setQ] = useState(''); // search query untuk NIB / Nama BU
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

    // query supabase dengan search (NIB / Nama BU) supaya data tidak terlalu berat
    const query = q.trim();

    let sb = supabase
      .from('rekap_bujk')
      .select(
        `id,no,nib,nama_badan_usaha,pjbu,
         jenis,sifat,klasifikasi,layanan,
         bentuk,kualifikasi,
         sbu,nib_persyaratan,
         peningkatan_kapasitas_sdm,peningkatan_peralatan,peningkatan_teknologi,
         peningkatan_kualitas_keuangan,peningkatan_manajemen_usaha`,
      )
      .order('no', { ascending: true });

    if (query) {
      // cari ke NIB atau Nama BU
      // format or: "nib.ilike.%abc%,nama_badan_usaha.ilike.%abc%"
      sb = sb.or(`nib.ilike.%${query}%,nama_badan_usaha.ilike.%${query}%`);
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

  // apply filter status di client (lebih fleksibel karena "status keseluruhan" gabungan banyak kolom)
  const filteredRows = useMemo(() => {
    const base = rows.map((r) => ({ ...r, _overall: overallStatus(r) as any }));
    if (filter === 'all') return base as any;
    return base.filter((r: any) => r._overall === filter) as any;
  }, [rows, filter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const tertib = rows.filter((r) => overallStatus(r) === 'tertib').length;
    const belum = total - tertib;
    return { total, tertib, belum };
  }, [rows]);

  async function exportExcel() {
    setMsg(null);
    try {
      const XLSX = await import('xlsx');

      const dataForExcel = filteredRows.map((r: any) => ({
        No: r.no ?? '',
        NIB: r.nib,
        'Nama Badan Usaha': r.nama_badan_usaha,
        PJBU: r.pjbu,

        'Kegiatan Konstruksi - Jenis': labelStatus(r.jenis),
        'Kegiatan Konstruksi - Sifat': labelStatus(r.sifat),
        'Kegiatan Konstruksi - Klasifikasi': labelStatus(r.klasifikasi),
        'Kegiatan Konstruksi - Layanan': labelStatus(r.layanan),

        'Usaha & Segmentasi - Bentuk': labelStatus(r.bentuk),
        'Usaha & Segmentasi - Kualifikasi': labelStatus(r.kualifikasi),

        'Persyaratan - SBU': labelStatus(r.sbu),
        'Persyaratan - NIB (Persyaratan)': labelStatus(r.nib_persyaratan),

        'Pengembangan - Kapasitas SDM': labelStatus(r.peningkatan_kapasitas_sdm),
        'Pengembangan - Peralatan': labelStatus(r.peningkatan_peralatan),
        'Pengembangan - Teknologi': labelStatus(r.peningkatan_teknologi),
        'Pengembangan - Kualitas Keuangan': labelStatus(r.peningkatan_kualitas_keuangan),
        'Pengembangan - Manajemen Usaha': labelStatus(r.peningkatan_manajemen_usaha),

        'Status Keseluruhan': overallStatus(r),
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap BUJK');

      // download file
      XLSX.writeFile(wb, `tertib-usaha-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e: any) {
      setMsg(`Gagal export: ${e?.message ?? 'unknown error'}`);
    }
  }

  async function deleteRow(row: RekapBujkRow) {
    setMsg(null);

    if (role !== 'admin') {
      setMsg('Akses ditolak. Hanya admin yang bisa hapus data.');
      return;
    }

    const ok = window.confirm(
      `Hapus data?\n\nNo: ${row.no ?? '-'}\nNIB: ${row.nib}\nNama: ${row.nama_badan_usaha}`,
    );
    if (!ok) return;

    const { error } = await supabase.from('rekap_bujk').delete().eq('id', row.id);
    if (error) {
      setMsg(`Gagal hapus: ${error.message}`);
      return;
    }

    setMsg('Data berhasil dihapus.');
    // refresh list
    loadData();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-7">
        {/* Header */}
        <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">
          ← Kembali ke Dashboard
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tertib Usaha Jasa Konstruksi</h1>
            <p className="text-sm text-slate-600">
              Rekapitulasi Pengawasan Badan Usaha Jasa Konstruksi (BUJK)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 border">
              Role: <span className="font-semibold">{role ?? '-'}</span>
            </span>

            {role === 'admin' && (
              <Link
                href="/tertib-usaha/tambah"
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
            <p className="text-xs text-slate-600 mt-1">
              Cari berdasarkan NIB atau Nama Badan Usaha
            </p>

            <div className="mt-3 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="contoh: 1267... / CV. JASA..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <button
                onClick={loadData}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-800">
                Cari
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Tips: tekan tombol <b>Cari</b> setelah mengetik.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Filter Status Keseluruhan</div>
            <p className="text-xs text-slate-600 mt-1">
              Status keseluruhan = <b>Belum Tertib</b> jika ada minimal 1 kolom belum tertib.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
                Semua
              </FilterPill>
              <FilterPill active={filter === 'tertib'} onClick={() => setFilter('tertib')}>
                Tertib
              </FilterPill>
              <FilterPill
                active={filter === 'belum_tertib'}
                onClick={() => setFilter('belum_tertib')}>
                Belum Tertib
              </FilterPill>
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
            <table className="min-w-[1700px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-sky-700 text-white">
                  <Th rowSpan={2}>No</Th>
                  <Th rowSpan={2}>NIB</Th>
                  <Th rowSpan={2}>Nama Badan Usaha</Th>
                  <Th rowSpan={2}>PJBU</Th>

                  <Th colSpan={4}>Kesesuaian Kegiatan Konstruksi</Th>
                  <Th colSpan={2}>Kegiatan Usaha & Segmentasi Pasar</Th>
                  <Th colSpan={2}>Pemenuhan Persyaratan Usaha</Th>
                  <Th colSpan={5}>Pengembangan usaha berkelanjutan</Th>

                  <Th rowSpan={2}>Status</Th>
                  <Th rowSpan={2}>Aksi</Th>
                </tr>

                <tr className="bg-sky-700 text-white">
                  <Th>Jenis</Th>
                  <Th>Sifat</Th>
                  <Th>Klasifikasi</Th>
                  <Th>Layanan</Th>

                  <Th>Bentuk</Th>
                  <Th>Kualifikasi</Th>

                  <Th>SBU</Th>
                  <Th>NIB (Persyaratan)</Th>

                  <Th>Kapasitas SDM</Th>
                  <Th>Peralatan</Th>
                  <Th>Teknologi</Th>
                  <Th>Kualitas Keuangan</Th>
                  <Th>Manajemen Usaha</Th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={19} className="p-8 text-center text-slate-600">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredRows.map((r: any) => {
                      const ov = overallStatus(r);
                      return (
                        <tr
                          key={r.id}
                          className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition">
                          <Td>{r.no ?? '-'}</Td>
                          <Td>{r.nib}</Td>
                          <Td>{r.nama_badan_usaha}</Td>
                          <Td>{r.pjbu}</Td>

                          <TdBadge value={r.jenis} />
                          <TdBadge value={r.sifat} />
                          <TdBadge value={r.klasifikasi} />
                          <TdBadge value={r.layanan} />

                          <TdBadge value={r.bentuk} />
                          <TdBadge value={r.kualifikasi} />

                          <TdBadge value={r.sbu} />
                          <TdBadge value={r.nib_persyaratan} />

                          <TdBadge value={r.peningkatan_kapasitas_sdm} />
                          <TdBadge value={r.peningkatan_peralatan} />
                          <TdBadge value={r.peningkatan_teknologi} />
                          <TdBadge value={r.peningkatan_kualitas_keuangan} />
                          <TdBadge value={r.peningkatan_manajemen_usaha} />

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
                        <td colSpan={19} className="p-8 text-center text-slate-600">
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

function FilterPill({
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
      className="border border-sky-600 px-3 py-2 text-center align-middle font-semibold whitespace-nowrap"
      colSpan={colSpan}
      rowSpan={rowSpan}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-slate-200 px-3 py-2 whitespace-nowrap">{children}</td>;
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

# Apotek Online RSU Aminah Blitar

Aplikasi web untuk petugas admin farmasi: membuat resep obat kronis sesuai SEP pasien BPJS, input obatnya, lalu menyiapkan dokumen klaim ke BPJS.

Untuk setup project, aturan git, dan cara rilis, baca [CONTRIBUTING.md](CONTRIBUTING.md).

## Menu

| Menu | Fungsi |
|---|---|
| Rekam Obat > Pelayanan Obat | Cari SEP pasien, buat resep, input obat, dan siapkan dokumen klaim |
| Rekam Obat > Daftar Resep Masuk | Daftar resep yang sudah terkirim ke BPJS |
| Referensi | Data referensi BPJS: obat, riwayat pelayanan, faskes, spesialis, apotek, poli |
| Daftar Verifikasi Obat | Cek dan verifikasi resep per jenis obat |

Login pakai nama unit dan password.

## Pelayanan Obat

Halaman ini dipakai dari kiri ke kanan.

1. Isi **ID Pasien** lalu **Cari SEP**. Data pasien muncul berikut nomor SEP, nomor kartu, dan No RM. Klik nomor untuk menyalinnya.
2. Klik ikon di sebelah SEP untuk mengisi form resep dengan SEP itu. Kalau pasien belum punya SEP, klik **Cari SEP** lalu **Pilih SEP**.
3. Lengkapi form resep. Nomor resep terisi otomatis, poli bisa dicari dengan mengetik nama poli. Pilih **Jenis Resep** dan **Iterasi**, lalu **Simpan**. Satu SEP maksimal 3 resep.
4. Resep yang sudah dibuat tampil di panel samping. Klik **Input Obat** untuk mengisi obatnya.

Tombol di data pasien:

| Tombol | Fungsi |
|---|---|
| Generate SEP | Cetak dokumen SEP |
| Generate Resep | Cetak dokumen resep |
| Cek Penyerahan Obat | Cek dokumen serah obat |
| Billing Farmasi | Cetak billing farmasi |
| TTD Penyerahan Obat | Tanda tangan pasien saat obat diserahkan |
| Download Dokumen Klaim | Gabungan dokumen untuk klaim ke BPJS |
| Buka Riwayat Pelayanan | Riwayat obat pasien dari BPJS per periode |

### Input Obat

- **Import data** mengambil obat dari billing pasien sesuai PX Id. **Tambah Baris** untuk menambah obat manual.
- Isi **Kode BPJS** di tiap baris. Ketik minimal 4 huruf lalu pilih obatnya, harga terisi otomatis.
- Simpan per baris. Obat yang sudah tersimpan muncul di tabel bawah dan bisa dihapus dari situ.

## Daftar Resep Masuk

Pilih jenis obat, jenis tanggal, dan rentang tanggal, lalu **Terapkan**. Di tiap baris ada tombol **Input Obat** dan **Hapus Resep**.

## Referensi

| Menu | Cara cari |
|---|---|
| Referensi Obat | Daftar obat DPHO BPJS |
| Riwayat Pelayanan | Nomor kartu BPJS dan periode |
| Referensi Faskes | Jenis faskes dan nama daerah |
| Referensi Spesialis | Daftar spesialistik |
| Referensi Apotek | Kode apotek |
| Referensi Poli | Kode poli |

## Daftar Verifikasi Obat

Pilih bulan, tahun, jenis obat, dan status (Belum Verifikasi atau Verifikasi), lalu **Terapkan**. Di atas tabel tampil total resep dan total biaya pengajuan. Centang beberapa resep untuk memverifikasinya sekaligus. Data bisa diunduh ke Excel.

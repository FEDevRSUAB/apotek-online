# Panduan Developer

Catatan untuk siapa saja yang mengerjakan project ini: cara menjalankan, aturan git, dan cara rilis ke server. Panduan pemakaian aplikasi ada di [README.md](README.md).

## Setup

Yang perlu disiapkan:

- Node.js 20.19 ke atas (syarat Vite 7)
- Git
- Akses collaborator ke repo ini

Atur identitas git dulu. Pakai email yang sama dengan akun GitHub supaya commit tercatat atas nama akun kamu.

```
git config --global user.name "Nama Lengkap"
git config --global user.email "email@contoh.com"
```

Lalu jalankan:

```
git clone https://github.com/FEDevRSUAB/apotek-online.git
cd apotek-online
npm install
npm run dev
```

Aplikasi jalan di `http://192.168.0.232:3010`.

## Environment

Alamat API diambil dari file `.env` sesuai mode.

| File | Dipakai saat |
|---|---|
| `.env.development` | `npm run dev` |
| `.env.production` | `npm run build` |

| Variabel | Isi |
|---|---|
| `VITE_API_WS_BASE_URL` | API utama apotek (SEP, resep, obat, referensi, monitoring) |
| `VITE_API_RS_BASE_URL` | API rumah sakit (import resep, nomor resep, cari obat RS) |
| `VITE_API_FARMASI_BASE_URL` | API dokumen farmasi (SEP, resep, billing, serah obat, klaim) |
| `VITE_API_FARMASI_V2_BASE_URL` | API data pasien dan riwayat SEP |
| `VITE_API_ESIGN_BASE_URL` | API tanda tangan penyerahan obat |

Semua client axios dibuat di `src/utils/Api.js` dan membaca `import.meta.env.VITE_...`. Jangan tulis IP server langsung di kode.

## Script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan untuk development |
| `npm run build` | Build production ke `dist` |
| `npm run preview` | Coba hasil build di lokal |

## Struktur folder

```
src/
  assets/        gambar
  components/    komponen yang dipakai di beberapa halaman (tabel, tombol, loader, export excel)
  pages/         login dan layout dashboard (sidebar, header)
  route/         daftar halaman
  store/         state global dan semua pemanggilan API (Vuex)
  utils/         client axios, alert, format tanggal
  views/         halaman per menu
  version.json   nomor versi aplikasi
```

## Alur git

`main` harus selalu bisa di-build. Jangan push langsung ke `main`, semua lewat Pull Request.

```
git checkout main
git pull
git checkout -b fix/harga-obat-kosong

# kerjakan, commit sedikit-sedikit
git add src/views/RekamObat/PelayananObat/ModalInput.vue
git commit -m "fix: harga obat kosong setelah pilih kode bpjs"

git push -u origin fix/harga-obat-kosong
```

Lalu buka Pull Request ke `main` di GitHub, cek lagi perubahannya, dan merge. Setelah itu:

```
git checkout main
git pull
git branch -d fix/harga-obat-kosong
```

Satu branch untuk satu pekerjaan. Kalau ada dua bug yang tidak berhubungan, pisah jadi dua branch.

### Nama branch

Format `jenis/keterangan-singkat`, huruf kecil, pakai tanda minus.

| Awalan | Untuk | Contoh |
|---|---|---|
| `feat/` | Fitur baru | `feat/cetak-label-obat` |
| `fix/` | Perbaikan bug | `fix/poli-tidak-terisi` |
| `refactor/` | Rapikan kode, perilaku tetap | `refactor/pecah-modal-input-obat` |
| `chore/` | Config, dependency, script | `chore/update-axios` |
| `docs/` | Dokumentasi | `docs/panduan-input-obat` |
| `hotfix/` | Perbaikan darurat di production | `hotfix/resep-gagal-simpan` |

### Pesan commit

Pakai format:

```
jenis: keterangan singkat
```

| Jenis | Dipakai untuk | Contoh |
|---|---|---|
| `feat` | Fitur baru | `feat: tombol tambah baris di input obat` |
| `fix` | Perbaikan bug | `fix: jumlah obat racikan tidak dibulatkan` |
| `refactor` | Ubah struktur kode, hasil sama | `refactor: pisah form resep ke komponen sendiri` |
| `style` | Format kode, spasi, indentasi | `style: rapikan indentasi CariSEP.vue` |
| `chore` | Config, dependency, versi | `chore: build v1.5.1` |
| `docs` | Dokumentasi | `docs: update README` |
| `revert` | Batalkan commit sebelumnya | `revert: feat: tombol tambah baris di input obat` |

Aturannya:

- Huruf kecil, tanpa titik di akhir, maksimal sekitar 70 karakter.
- Tulis apa yang berubah. `fix: harga obat kosong setelah pilih kode bpjs` lebih jelas daripada `fix: debug harga`.
- Satu commit satu perubahan. Jangan campur fitur baru dan perbaikan bug.
- Hindari pesan `update`, `debug`, `fix bug`, `wip`.

### Pull Request

- Judul PR ikut format commit.
- Di deskripsi, tulis apa yang berubah dan cara ngeceknya.
- Merge pakai **Create a merge commit**.
- Hapus branch setelah merge.

## Versi dan rilis

Format versi `MAJOR.MINOR.PATCH`.

| Bagian | Naik kalau |
|---|---|
| PATCH | Perbaikan bug |
| MINOR | Fitur baru |
| MAJOR | Perubahan besar di alur kerja |

Versi dinaikkan manual di `package.json` dan `src/version.json`.

Langkah rilis, setelah semua PR untuk rilis itu sudah masuk ke `main`:

1. `git checkout main` lalu `git pull`.
2. Buat branch rilis, misalnya `git checkout -b chore/rilis-v1.5.1`.
3. Ubah versi di `package.json` dan `src/version.json`, lalu `npm install` supaya `package-lock.json` ikut berubah.
4. `npm run build`, lalu coba hasilnya di server dev.
5. Commit `package.json`, `package-lock.json`, dan `src/version.json` dengan pesan `chore: build v1.5.1`. Push, buat PR, lalu merge.
6. Beri tag di `main`:
   ```
   git checkout main
   git pull
   git tag -a v1.5.1 -m "v1.5.1"
   git push origin v1.5.1
   ```
7. Kompres isi folder `dist` jadi `apotek-online-v1.5.1.rar`.
8. Di GitHub buka **Releases > Draft a new release**, pilih tag, tulis perubahan yang terasa ke user, lampirkan rar, lalu **Publish release**.

## Deploy ke server

Server cukup menyimpan versi yang sedang jalan. Versi lama ambil dari halaman Release.

1. Ambil rar dari Release, atau pakai hasil build lokal di `dist`.
2. Kosongkan folder tujuan di server, **kecuali `.htaccess`**.
3. Extract isinya ke folder itu.
4. Buka aplikasi dan cek fitur yang berubah.

Jangan timpa file baru di atas file lama tanpa mengosongkan folder dulu, nanti file lama di `assets` menumpuk.

Kalau versi baru bermasalah, ulangi langkah di atas pakai rar versi sebelumnya, lalu perbaiki lewat branch baru. Jangan edit langsung di folder server.

## Jangan di-commit

- `node_modules/`, `dist/`, `dist-staging/`
- File berisi data pasien atau password
- Hasil export Excel atau dokumen klaim

Sebelum commit, cek dulu `git status` dan `git diff --staged`.

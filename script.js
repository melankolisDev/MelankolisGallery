// Menunggu sampai seluruh struktur HTML halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {

    // Mendapatkan referensi ke elemen galeri di HTML
    const videoGallery = document.getElementById('video-gallery');

    // Memeriksa apakah elemen galeri ditemukan
    if (!videoGallery) {
        console.error("Elemen dengan ID 'video-gallery' tidak ditemukan!");
        return; // Hentikan eksekusi jika galeri tidak ada
    }

    // Mengambil data video dari file videos.json
    fetch('data/videos.json') // Memulai permintaan untuk mengambil file
        .then(response => {
            // Memeriksa apakah permintaan berhasil (status code 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Mengubah respons menjadi objek JavaScript (JSON)
        })
        .then(videos => {
            // Algoritma Fisher-Yates (Knuth) Shuffle
            for (let i = videos.length - 1; i > 0; i--) {
                // Pilih indeks acak dari 0 sampai i (inklusif)
                const j = Math.floor(Math.random() * (i + 1));
                // Tukar elemen pada indeks i dan j
                [videos[i], videos[j]] = [videos[j], videos[i]];
            }
            displayVideos(videos); // Panggil fungsi untuk menampilkan video
        })
        .catch(error => {
            // Jika terjadi kesalahan saat mengambil atau mem-parse data
            console.error("Gagal memuat data video:", error);
            videoGallery.innerHTML = '<p>Maaf, gagal memuat daftar video.</p>'; // Tampilkan pesan error ke pengguna
        });

    // Fungsi untuk menampilkan video di galeri
    function displayVideos(videoArray) {
        // Mengosongkan konten galeri sebelumnya (misalnya, teks "Memuat video...")
        videoGallery.innerHTML = '';

        // Jika tidak ada video dalam data
        if (!videoArray || videoArray.length === 0) {
            videoGallery.innerHTML = '<p>Tidak ada video untuk ditampilkan.</p>';
            return;
        }

        // Melakukan loop untuk setiap objek video dalam array
        videoArray.forEach(video => {
            // Membuat elemen div baru untuk setiap item video
            const videoItem = document.createElement('div');
            videoItem.classList.add('video-item'); // Menambahkan kelas CSS 'video-item'

            // Menyimpan data penting ke elemen menggunakan atribut data-*
            // Ini akan kita gunakan nanti saat item diklik
            videoItem.dataset.id = video.id;
            videoItem.dataset.adUrl = video.ad_mp4_url;
            videoItem.dataset.mainUrl = video.main_mp4_url;
            videoItem.dataset.thumbUrl = video.thumbnail_url; // Simpan juga thumb untuk poster

            // Membuat elemen gambar untuk thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.src = video.thumbnail_url; // Mengatur sumber gambar
            thumbnail.alt = video.title; // Teks alternatif untuk gambar

            // Membuat elemen paragraf untuk judul
            const title = document.createElement('p');
            title.textContent = video.title; // Mengatur teks judul

            // Memasukkan gambar dan judul ke dalam div videoItem
            videoItem.appendChild(thumbnail);
            videoItem.appendChild(title);

            // Memasukkan videoItem yang sudah jadi ke dalam galeri
            videoGallery.appendChild(videoItem);
        });
    }
    // Mendapatkan referensi ke area pemutar dan elemen video/tombol/status di dalamnya
    const playerArea = document.getElementById('player-area');
    const videoPlayer = document.getElementById('video-player');
    const closePlayerButton = document.getElementById('close-player');
    const videoStatusIndicator = document.getElementById('video-status-indicator');
    const skipAdButton = document.getElementById('skip-ad-button');

    // Variabel untuk menyimpan timer tombol skip
    let skipAdTimer = null;

    // Memeriksa apakah elemen-elemen pemutar ditemukan (opsional, bisa dihapus jika yakin ada)
    if (!playerArea || !videoPlayer || !closePlayerButton || !videoStatusIndicator || !skipAdButton) {
        console.error("Satu atau lebih elemen pemutar video tidak ditemukan!");
    }

    // Menambahkan event listener ke seluruh galeri (Event Delegation)
    videoGallery.addEventListener('click', (event) => {
        const clickedItem = event.target.closest('.video-item');
        if (!clickedItem) {
            return;
        }

        const adUrl = clickedItem.dataset.adUrl;
        const mainUrl = clickedItem.dataset.mainUrl;
        const thumbUrl = clickedItem.dataset.thumbUrl;

        // --- AWAL BLOK LOGIKA BARU ---

        // 1. Periksa apakah URL Video Utama ada (ini wajib)
        if (!mainUrl) {
            console.error("URL utama TIDAK ditemukan pada item:", clickedItem.dataset.id);
            alert("Tidak dapat memutar video, URL video utama tidak valid.");
            return; // Hentikan jika URL utama tidak ada
        }

        // 2. Tentukan apa yang akan diputar pertama kali
        let firstVideoUrl;
        let isPlayingAd = false; // Penanda apakah kita memulai dengan iklan

        if (adUrl && adUrl.trim() !== "") { // Cek apakah adUrl ada DAN tidak kosong
            // Jika ada URL iklan yang valid
            firstVideoUrl = adUrl;
            isPlayingAd = true;
            playerArea.dataset.nextVideoUrl = mainUrl; // Simpan mainUrl untuk setelah iklan
            videoStatusIndicator.textContent = "Iklan"; // Set status
            skipAdButton.classList.add('hidden'); // Pastikan tombol skip tersembunyi

            // Hapus timer lama jika ada
            if (skipAdTimer) {
                clearTimeout(skipAdTimer);
                skipAdTimer = null;
            }

            // Set timer untuk tombol skip HANYA jika memutar iklan
            skipAdTimer = setTimeout(() => {
                if (playerArea.dataset.nextVideoUrl) { // Cek lagi jika masih iklan
                    skipAdButton.classList.remove('hidden');
                }
                skipAdTimer = null;
            }, 5000);

        } else {
            // Jika TIDAK ada URL iklan yang valid
            firstVideoUrl = mainUrl; // Langsung putar video utama
            isPlayingAd = false;
            // Pastikan tidak ada data nextVideo tersisa dari klik sebelumnya
            playerArea.removeAttribute('data-next-video-url');
            videoStatusIndicator.textContent = "Video Utama"; // Langsung set status utama
            skipAdButton.classList.add('hidden'); // Pastikan tombol skip tersembunyi

            // Batalkan timer jika kebetulan aktif (seharusnya tidak, tapi untuk keamanan)
            if (skipAdTimer) {
                clearTimeout(skipAdTimer);
                skipAdTimer = null;
            }
        }

        // 3. Siapkan dan tampilkan pemutar dengan URL yang sudah ditentukan
        videoPlayer.src = firstVideoUrl;
        videoPlayer.poster = thumbUrl;
        playerArea.classList.remove('hidden');

        // 4. Muat dan mainkan video pertama
        videoPlayer.load();
        videoPlayer.play().catch(error => {
            console.warn(`Gagal memulai pemutaran otomatis ${isPlayingAd ? 'iklan' : 'video utama'}:`, error);
        });

        // --- AKHIR BLOK LOGIKA BARU ---

        // ... (sisa kode event listener klik galeri, JANGAN HAPUS)
        // (Pastikan kode ini berada SEBELUM event listener tombol tutup, tombol skip, dan 'ended')
    });

    // Menambahkan event listener untuk tombol tutup
    closePlayerButton.addEventListener('click', () => {
        playerArea.classList.add('hidden');
        videoPlayer.pause();
        videoPlayer.src = "";
        playerArea.removeAttribute('data-next-video-url');

        // Hentikan timer skip jika sedang berjalan
        if (skipAdTimer) {
            clearTimeout(skipAdTimer);
            skipAdTimer = null;
        }
        // Pastikan tombol skip disembunyikan
        skipAdButton.classList.add('hidden');
        videoStatusIndicator.textContent = "Sedang Memuat..."; // Reset status
    });

    // Menambahkan event listener untuk tombol lewati iklan
    skipAdButton.addEventListener('click', () => {
        console.log("Tombol lewati iklan diklik.");
        const nextVideoUrl = playerArea.dataset.nextVideoUrl;

        if (nextVideoUrl) {
            // Batalkan timer jika tombol skip diklik sebelum 5 detik
            if (skipAdTimer) {
                clearTimeout(skipAdTimer);
                skipAdTimer = null;
            }

            videoPlayer.src = nextVideoUrl;
            playerArea.removeAttribute('data-next-video-url'); // Hapus penanda iklan
            videoStatusIndicator.textContent = "Video Utama"; // Update status
            skipAdButton.classList.add('hidden'); // Sembunyikan tombol skip lagi

            videoPlayer.load();
            videoPlayer.play().catch(error => {
                console.warn("Gagal memulai pemutaran otomatis video utama (setelah skip):", error);
            });
        } else {
            console.warn("Tombol skip diklik, tapi tidak ada URL video utama ditemukan.");
        }
    });

    // Menambahkan event listener untuk mendeteksi akhir video (iklan atau utama)
    videoPlayer.addEventListener('ended', () => {
        console.log("Video selesai diputar.");
        const nextVideoUrl = playerArea.dataset.nextVideoUrl;

        if (nextVideoUrl) {
            console.log("Iklan selesai, memutar video utama:", nextVideoUrl);

            // Batalkan timer jika iklan selesai sebelum 5 detik
            if (skipAdTimer) {
                clearTimeout(skipAdTimer);
                skipAdTimer = null;
            }

            videoPlayer.src = nextVideoUrl;
            playerArea.removeAttribute('data-next-video-url');
            videoStatusIndicator.textContent = "Video Utama";
            skipAdButton.classList.add('hidden'); // Pastikan tombol skip tersembunyi

            videoPlayer.load();
            videoPlayer.play().catch(error => {
                console.warn("Gagal memulai pemutaran otomatis video utama (setelah iklan):", error);
            });
        } else {
            console.log("Video utama selesai.");
            videoStatusIndicator.textContent = "Selesai"; // Update status saat video utama selesai
            skipAdButton.classList.add('hidden'); // Pastikan tersembunyi
            // Opsional: Tutup otomatis
            // playerArea.classList.add('hidden');
            // videoPlayer.pause();
            // videoPlayer.src = "";
        }
    });

}); // Akhir dari event listener DOMContentLoaded
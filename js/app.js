/**
 * app.js - Logika Utama, Router, State Management, & Renderer LegalIn UMKM
 * Versi Clean Professional dengan Foto Profil Konsultan, Booking Jadwal Temu Menyeluruh,
 * dan Sistem Pembayaran Escrow Interaktif (QRIS, VA, E-Wallet, Invoice).
 */

// State Aplikasi Global
let S = null;
let currentTab = "home";
let activeBooking = null; // Data sementara booking konsultan
let activePackageId = "dasar";
let activeConsultationIndex = 0;
let kbliSearchTerm = "";
let kbliCategory = "Semua";
let selectedContractIndex = 0;
let contractFormData = {};
let generatedContractText = "";
let activeNoteSession = null;
let vaultSubTab = "b"; // 'b' = Brankas, 'p' = Pengingat
let isAddingDoc = false;
let newDocForm = { type: 0, name: "", exp: "", file: "" };
let deleteConfirmId = null;

// State Sistem Pembayaran
let paymentState = {
  item: null,          // item yang dibayar (konsul/paket)
  method: "qris",      // qris | bca_va | mandiri_va | bri_va | ewallet
  promoCode: "",
  discount: 0,
  step: "checkout",    // checkout | waiting | success
  trxId: "",
  paidTime: "",
  ewalletPhone: ""
};

// Inisialisasi State dari localStorage
function initState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      S = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Gagal membaca localStorage:", e);
  }

  // Jika belum ada data, gunakan data demo siap pakai
  if (!S || !S.user) {
    S = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
    saveState();
  }
}

// Simpan State
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  } catch (e) {
    console.error("Gagal menyimpan localStorage:", e);
  }
}

// Reset ke Data Demo
function resetToDemo() {
  S = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
  saveState();
  renderApp();
  showToast("Data demo berhasil dimuat ulang!");
}

// Reset ke Data Kosong (Pengguna Baru)
function resetToBlank() {
  S = {
    user: null,
    biz: null,
    done: {},
    docs: [],
    rem: [],
    lead: 30,
    ch: ["app"],
    sessions: [],
    order: null,
    diag: null,
    mc: {},
    hl: {},
    apiKey: "",
    cons: false
  };
  saveState();
  currentTab = "home";
  renderApp();
  showToast("Aplikasi di-reset ke kondisi awal!");
}

// Helper DOM & Sanitasi
function $(selector) {
  return document.querySelector(selector);
}

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatRp(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
}

function formatDate(isoStr) {
  if (!isoStr) return "-";
  return new Date(isoStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function daysDiff(isoStr) {
  if (!isoStr) return 9999;
  const target = new Date(isoStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function showToast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2400);
}

function renderIcon(d, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

// Generator Kode QRIS Realistis (SVG)
function generateQrisSvg() {
  let q = 7, r = "";
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const isCorner = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      let on;
      if (isCorner) {
        const a = x > 13 ? x - 14 : x;
        const b = y > 13 ? y - 14 : y;
        on = (a === 0 || a === 6 || b === 0 || b === 6) || (a >= 2 && a <= 4 && b >= 2 && b <= 4);
      } else {
        q = (q * 73 + x * 31 + y * 17) % 101;
        on = q % 3 === 0;
      }
      if (on) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  return `<svg viewBox="-1 -1 23 23" width="180" height="180" style="background:#fff;border-radius:8px;padding:4px" fill="#0F172A" aria-label="QRIS Code">${r}</svg>`;
}

// Navigasi ke Tab Baru
function navigateTo(tab) {
  currentTab = tab;
  renderApp();
  window.scrollTo(0, 0);
}

/* ==========================================================================
   VIEW 1: BERANDA (HOME)
   ========================================================================== */
function viewHome() {
  const user = S.user || { biz: "Pelaku UMKM", owner: "Pemilik Usaha", avatar: "" };
  const rules = S.biz ? generateLegalRules(S.biz) : [];
  const completedCount = rules.filter(r => S.done && S.done[r.id]).length;
  const progressPct = rules.length ? Math.round((completedCount / rules.length) * 100) : 0;

  let h = `
    <!-- Top Header Bar Profil -->
    <div class="row sp" style="margin-bottom: 12px; padding: 4px 0">
      <div class="row" style="gap: 12px">
        <div class="avatar-wrap">
          <img class="avatar-img sm" src="${user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80"}" alt="${esc(user.owner)}">
          <span class="avatar-badge">✓</span>
        </div>
        <div>
          <h1 style="font-size: 19px; line-height: 1.2">${esc(user.biz)}</h1>
          <p class="mute" style="font-size: 12px">${esc(user.owner)} · ${esc(user.city || "Indonesia")}</p>
        </div>
      </div>
      <button class="btn sm sec" data-go="prof" aria-label="Buka Pengaturan Profil" style="border-radius: var(--radius-full); padding: 8px 12px; font-size: 12px">
        Pengaturan
      </button>
    </div>

    <!-- Hero Banner Cek Izin -->
    <div class="hero">
      <svg class="art" viewBox="0 0 120 100" aria-hidden="true">
        <rect x="6" y="62" width="22" height="32" rx="2" fill="#fff" opacity=".2"/>
        <rect x="32" y="44" width="26" height="50" rx="2" fill="#fff" opacity=".3"/>
        <rect x="62" y="58" width="20" height="36" rx="2" fill="#fff" opacity=".2"/>
        <rect x="60" y="6" width="48" height="62" rx="5" fill="#fff"/>
        <circle cx="84" cy="50" r="10" fill="#F2DFA0"/>
        <path d="M79 50l3.6 3.6 6.4-7" stroke="#047857" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>Cek Kepatuhan Legalitas Gratis</h3>
      <p>Ketahui izin wajib yang harus dimiliki usahamu (NIB, P-IRT, Halal, Merek DJKI, BPOM) dalam 1 menit.</p>
      <button class="btn" style="background: #FFFFFF; color: #047857; width: auto; padding: 10px 18px" data-go="cek">
        ${S.biz ? "Lihat Status Izin Usaha" : "Mulai Cek Izin Sekarang"}
      </button>
    </div>

    <!-- Banner Pintas AI Assistant -->
    <div class="card row sp" style="background: var(--pri-light); border-color: var(--pri); margin-top: 14px; cursor: pointer" data-action="open-ai">
      <div class="row" style="gap: 12px">
        <div style="background: var(--pri); color: #FFFFFF; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; flex: none">
          🤖
        </div>
        <div>
          <h3 style="font-size: 14.5px; color: var(--pri-dark)">Tanya Asisten AI Legal & Bisnis</h3>
          <p class="mute" style="font-size: 12px">Konsultasi instan syarat NIB, Halal, HPP, atau pajak 24 jam</p>
        </div>
      </div>
      <button class="btn sm" style="pointer-events: none; padding: 7px 12px; font-size: 12px">Tanya AI</button>
    </div>
  `;

  // Progress Kesiapan Izin
  if (rules.length) {
    const nextItem = rules.find(r => !S.done || !S.done[r.id]);
    h += `
      <h2>Kesiapan Izin Usahamu</h2>
      <div class="card row" data-go="cek" style="cursor: pointer" tabindex="0">
        <div class="ring" style="background: conic-gradient(var(--pri) ${progressPct}%, var(--line) 0)">
          <b>${progressPct}%</b>
        </div>
        <div style="min-width: 0">
          <h3>${completedCount} dari ${rules.length} Izin Selesai</h3>
          <p class="mute">${nextItem ? "Berikutnya: " + esc(nextItem.n) : "Semua izin dasar telah lengkap!"}</p>
        </div>
      </div>
    `;
  }

  // Sesi Temu Konsultan Terdekat
  const upcomingSessions = (S.sessions || []).filter(s => s.st === "akan");
  if (upcomingSessions.length) {
    const s = upcomingSessions[0];
    h += `
      <h2>
        <span>Jadwal Temu Konsultan Terdekat</span>
        <button class="back" data-go="jdw" style="font-size: 13px; padding: 0">Lihat Semua</button>
      </h2>
      <div class="card row sp" data-go="jdw" style="cursor: pointer">
        <div class="row" style="gap: 12px">
          <img class="avatar-img sm" src="${s.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80"}" alt="${esc(s.who)}">
          <div>
            <h3>${esc(s.title)}</h3>
            <p class="mute">${formatDate(s.d)} · ${esc(s.slot || "09.00")} WIB · <b>${esc(s.fmt || "Chat")}</b></p>
          </div>
        </div>
        <button class="btn sm" data-room="${(S.sessions || []).indexOf(s)}">Masuk Sesi</button>
      </div>
    `;
  }

  // Menu Cepat Navigasi
  h += `
    <h2>Fitur Utama LegalIn</h2>
    <div class="grid">
      <button class="qa" data-go="konsul">
        <span>${renderIcon("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z")}</span>
        Temu Konsultan
      </button>
      <button class="qa" data-go="kbli">
        <span>${renderIcon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z")}</span>
        Pencari KBLI
      </button>
      <button class="qa" data-go="paket">
        <span>${renderIcon("M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z")}</span>
        Paket Izin
      </button>
      <button class="qa" data-go="kontrak">
        <span>${renderIcon("M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z")}</span>
        Draf Kontrak
      </button>
      <button class="qa" data-go="pajak">
        <span>${renderIcon("M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z")}</span>
        Pajak 0,5%
      </button>
      <button class="qa" data-go="dok">
        <span>${renderIcon("M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4")}</span>
        Brankas Izin
      </button>
    </div>

    <!-- Nilai Tambah Kepercayaan -->
    <h2>Garansi & Keamanan Platform</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px">
      <div class="card" style="padding: 12px 6px; text-align: center; margin: 0">
        <span style="font-size: 20px; display: block; margin-bottom: 4px">⚖️</span>
        <b style="font-size: 11.5px; display: block; line-height: 1.3">Konsultan Terverifikasi</b>
      </div>
      <div class="card" style="padding: 12px 6px; text-align: center; margin: 0">
        <span style="font-size: 20px; display: block; margin-bottom: 4px">🛡️</span>
        <b style="font-size: 11.5px; display: block; line-height: 1.3">Escrow Garansi Aman</b>
      </div>
      <div class="card" style="padding: 12px 6px; text-align: center; margin: 0">
        <span style="font-size: 20px; display: block; margin-bottom: 4px">🔒</span>
        <b style="font-size: 11.5px; display: block; line-height: 1.3">Data Sesuai UU PDP</b>
      </div>
    </div>
  `;

  return h;
}

/* ==========================================================================
   VIEW 2: CEK IZIN (WIZARD & CHECKLIST)
   ========================================================================== */
let wizardStep = 0;
let wizardAnswers = {};

function viewCekIzin() {
  if (!S.biz) {
    const q = LEGAL_QUESTIONS[wizardStep];
    let h = `
      <div class="bar" style="margin: 8px 0 16px">
        <i style="width: ${(wizardStep / LEGAL_QUESTIONS.length) * 100}%"></i>
      </div>
      <p class="mute">Langkah ${wizardStep + 1} dari ${LEGAL_QUESTIONS.length}</p>
      <h1 style="margin: 6px 0 16px">${esc(q.q)}</h1>
    `;

    q.o.forEach(opt => {
      h += `
        <button class="pay-opt" data-wz-ans="${esc(opt[0])}">
          <span class="rad"></span>
          <b style="font-size: 14.5px; color: var(--ink)">${esc(opt[1])}</b>
        </button>
      `;
    });

    if (wizardStep > 0) {
      h += `<button class="btn sec" data-wz-back="1" style="margin-top: 10px">← Kembali ke Pertanyaan Sebelumnya</button>`;
    }
    return h;
  }

  const rules = generateLegalRules(S.biz);
  const doneCount = rules.filter(r => S.done && S.done[r.id]).length;
  const pct = Math.round((doneCount / rules.length) * 100);

  let h = `
    <button class="back" data-go="home">← Beranda</button>
    <h1>Daftar Izin Wajib Usahamu</h1>
    <p class="mute" style="margin: 4px 0 14px">Ketuk tanda centang untuk memperbarui status izin usahamu.</p>

    <div class="card row">
      <div class="ring" style="background: conic-gradient(var(--pri) ${pct}%, var(--line) 0)">
        <b>${pct}%</b>
      </div>
      <div>
        <h3>${doneCount} dari ${rules.length} Izin Selesai</h3>
        <p class="mute">Prioritaskan izin berstatus <b>Wajib</b> untuk menghindari sanksi administratif.</p>
      </div>
    </div>
  `;

  rules.forEach(r => {
    const isDone = !!(S.done && S.done[r.id]);
    h += `
      <div class="card chk ${isDone ? "done" : ""}" data-toggle-rule="${esc(r.id)}" tabindex="0" role="checkbox" aria-checked="${isDone}">
        <div class="box">${isDone ? "✓" : ""}</div>
        <div style="min-width: 0">
          <div class="row sp">
            <h3>${esc(r.n)}</h3>
            <span class="tag ${r.w ? "bad" : "ok"}">${r.w ? "Wajib" : "Disarankan"}</span>
          </div>
          <p class="mute" style="font-size: 11.5px; margin: 2px 0 4px">Penerbit: ${esc(r.agency)}</p>
          <div class="det">${esc(r.d)}</div>
        </div>
      </div>
    `;
  });

  h += `
    <button class="btn" data-go="paket" style="margin-top: 8px">
      Urus Dokumen Resmi via Paket
    </button>
    <button class="btn sec" data-redo-wizard="1" style="margin-top: 8px">
      Ulangi Penilaian Cek Izin
    </button>
  `;

  return h;
}

/* ==========================================================================
   VIEW 3: KATALOG KONSULTAN DENGAN FOTO PROFIL PROFESIONAL
   ========================================================================== */
let consultantType = "h"; // 'h' = hukum, 'b' = bisnis
let consultantCity = "Semua";

function viewKonsultan() {
  const cities = ["Semua", "Solo", "Semarang", "Yogyakarta", "Jakarta"];
  const list = CONSULTANTS.filter(c => {
    const matchType = c.type === consultantType;
    const matchCity = consultantCity === "Semua" || c.city === consultantCity;
    return matchType && matchCity;
  });

  let h = `
    <h1>Pilih Konsultan Terverifikasi</h1>
    <p class="mute" style="margin: 4px 0 12px">Temui praktisi hukum dan mentor bisnis secara langsung di kantor atau via online.</p>

    <!-- Tab Bidang Keahlian -->
    <div class="seg">
      <button class="${consultantType === "h" ? "on" : ""}" data-konsul-type="h">Konsultan Hukum (${CONSULTANTS.filter(c => c.type === "h").length})</button>
      <button class="${consultantType === "b" ? "on" : ""}" data-konsul-type="b">Konsultan Bisnis (${CONSULTANTS.filter(c => c.type === "b").length})</button>
    </div>

    <!-- Filter Kota -->
    <div class="chips">
  `;

  cities.forEach(ct => {
    h += `<button class="chip ${ct === consultantCity ? "on" : ""}" data-konsul-city="${ct}">${ct}</button>`;
  });

  h += `</div><p class="mute" style="margin: 6px 0 12px">Menampilkan <b>${list.length}</b> konsultan terverifikasi:</p>`;

  list.forEach(c => {
    const idx = CONSULTANTS.indexOf(c);
    h += `
      <div class="card">
        <div class="row" style="align-items: flex-start; gap: 14px">
          <div class="avatar-wrap">
            <img class="avatar-img lg" src="${c.avatar}" alt="${esc(c.name)}" onerror="this.src='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80'">
            <span class="avatar-badge">✓</span>
          </div>
          <div style="min-width: 0; flex: 1">
            <div class="row sp">
              <h3 style="font-size: 15.5px">${esc(c.name)}</h3>
              <span class="tag ok" style="font-size: 11px">★ ${c.rating} (${c.reviewsCount})</span>
            </div>
            <p class="mute" style="font-size: 12px; margin: 2px 0 4px"><b>${esc(c.spec)}</b> · ${esc(c.city)}</p>
            <p style="font-size: 13px; line-height: 1.45; color: var(--ink-sec)">${esc(c.bio)}</p>
          </div>
        </div>

        <div class="row sp" style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line)">
          <div>
            <span class="mute" style="font-size: 11px">Mulai dari:</span><br>
            <span class="price">${formatRp(c.rate)}</span>
            <span class="mute" style="font-size: 11px"> / 45 menit</span>
          </div>
          <button class="btn sm" data-start-booking="${idx}">
            Jadwalkan Temu
          </button>
        </div>
      </div>
    `;
  });

  return h;
}

/* ==========================================================================
   VIEW 4: FITUR BOOKING JADWAL TEMU KONSULTAN (LENGKAP)
   ========================================================================== */
function viewBooking() {
  if (!activeBooking) return viewKonsultan();
  const c = CONSULTANTS[activeBooking.i];
  
  // Format Pertemuan
  const formats = [
    { id: "chat", title: "Chat Aplikasi & Berkas", desc: "Konsultasi via chat interaktif & berbagi dokumen", icon: "💬" },
    { id: "video", title: "Video Call (Google Meet)", desc: "Tatap muka online berdurasi 45 menit", icon: "📹" },
    { id: "offline", title: "Tatap Muka di Kantor", desc: "Temu fisik di kantor konsultan (" + c.city + ")", icon: "🏢" }
  ];

  // Pilihan Tanggal
  const daysList = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    daysList.push({
      dateStr: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("id-ID", { weekday: "short" }),
      dateNum: d.getDate(),
      monthName: d.toLocaleDateString("id-ID", { month: "short" })
    });
  }

  // Pilihan Jam Sesi
  const timeSlots = ["09.00", "10.30", "13.30", "15.00", "16.30", "19.00"];

  return `
    <button class="back" data-go="konsul">← Kembali ke Konsultan</button>
    <h1>Jadwal Temu Konsultan</h1>
    <p class="mute" style="margin: 4px 0 14px">Pilih bentuk pertemuan, tanggal, dan jam yang sesuai dengan agenda usahamu.</p>

    <!-- Kartu Konsultan Terpilih -->
    <div class="card row" style="gap: 12px">
      <img class="avatar-img" src="${c.avatar}" alt="${esc(c.name)}">
      <div>
        <h3 style="font-size: 15px">${esc(c.name)}</h3>
        <p class="mute" style="font-size: 12px">${esc(c.title)}</p>
        <p class="mute" style="font-size: 11.5px">📍 ${esc(c.address)}</p>
      </div>
    </div>

    <!-- 1. Bentuk Sesi Pertemuan -->
    <h2>1. Pilih Format Pertemuan</h2>
    ${formats.map((fmt, idx) => `
      <div class="pay-opt ${activeBooking.fmtIdx === idx ? "active" : ""}" data-booking-fmt="${idx}">
        <span class="rad"></span>
        <div style="flex: 1">
          <b>${fmt.icon} ${fmt.title}</b>
          <p class="mute" style="font-size: 12px; margin-top: 2px">${fmt.desc}</p>
        </div>
      </div>
    `).join("")}

    <!-- 2. Pilih Topik Masalah -->
    <h2>2. Topik Utama Pembahasan</h2>
    <div class="chips" style="flex-wrap: wrap">
      ${c.topics.map((t, idx) => `
        <button class="chip ${activeBooking.topicIdx === idx ? "on" : ""}" data-booking-topic="${idx}">
          ${t}
        </button>
      `).join("")}
    </div>

    <!-- 3. Pilih Hari & Tanggal -->
    <h2>3. Pilih Tanggal Pertemuan</h2>
    <div class="chips" style="gap: 8px">
      ${daysList.map((d, idx) => `
        <button class="chip ${activeBooking.dayIdx === idx ? "on" : ""}" data-booking-day="${idx}" style="text-align: center; padding: 8px 14px">
          <small style="display: block; font-size: 10px">${d.dayName}</small>
          <b>${d.dateNum} ${d.monthName}</b>
        </button>
      `).join("")}
    </div>

    <!-- 4. Pilih Jam Sesi -->
    <h2>4. Pilih Jam Konsultasi (WIB)</h2>
    <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 8px">
      ${timeSlots.map((ts, idx) => `
        <button class="chip ${activeBooking.slotIdx === idx ? "on" : ""}" data-booking-slot="${idx}" style="text-align: center; border-radius: var(--radius-md)">
          ${ts} WIB
        </button>
      `).join("")}
    </div>

    <!-- 5. Catatan Awal Permasalahan -->
    <h2>5. Catatan Singkat Kendala (Opsional)</h2>
    <div class="card" style="padding: 12px">
      <label class="lb" for="booking-notes" style="margin-top: 0">Ceritakan ringkas apa yang ingin Anda konsultasikan:</label>
      <textarea id="booking-notes" class="inp" rows="3" placeholder="Contoh: Saya ingin menanyakan apakah nama merek sambal saya sudah ada yang pakai di DJKI..." data-action="booking-notes-inp">${esc(activeBooking.notes || "")}</textarea>
    </div>

    <!-- Rincian Biaya & Lanjut -->
    <div class="card row sp" style="margin-top: 14px; background: var(--card-alt)">
      <div>
        <span class="mute" style="font-size: 11px">Tarif Sesi 45 Menit:</span><br>
        <span class="price">${formatRp(c.rate)}</span>
      </div>
      <button class="btn sm" data-action="go-to-checkout" style="padding: 12px 20px">
        Lanjut ke Pembayaran →
      </button>
    </div>
  `;
}

/* ==========================================================================
   VIEW 5: TAMPILAN CHECKOUT & PEMBAYARAN ESCROW (LENGKAP)
   ========================================================================== */
function viewPayment() {
  const item = paymentState.item;
  if (!item) return viewKonsultan();

  const fee = 2500; // Biaya platform & escrow proteksi
  const subtotal = item.price;
  const discount = paymentState.discount || 0;
  const total = Math.max(0, subtotal + fee - discount);

  // STEP 1: CHECKOUT & PILIH METODE BAYAR
  if (paymentState.step === "checkout") {
    return `
      <button class="back" data-go="book">← Kembali ke Jadwal</button>
      <h1>Pembayaran Escrow Aman</h1>
      <p class="mute" style="margin: 4px 0 14px">Dana ditahan aman oleh sistem LegalIn dan baru dicairkan setelah sesi selesai.</p>

      <!-- Ringkasan Layanan -->
      <div class="card">
        <span class="tag ok" style="margin-bottom: 6px">Terlindungi Sistem Escrow</span>
        <h3 style="font-size: 16px">${esc(item.title)}</h3>
        <p class="mute" style="font-size: 12.5px">${esc(item.sub)}</p>

        <div style="margin-top: 12px; border-top: 1px dashed var(--line); padding-top: 10px">
          <div class="rc"><span>Biaya Konsultasi</span><b>${formatRp(subtotal)}</b></div>
          <div class="rc"><span>Biaya Layanan &amp; Escrow</span><b>${formatRp(fee)}</b></div>
          ${discount ? `<div class="rc" style="color: var(--ok)"><span>Diskon Kupon</span><b>-${formatRp(discount)}</b></div>` : ""}
          <div class="rc" style="font-size: 15px; border-top: 1px solid var(--line); padding-top: 8px">
            <b>Total Pembayaran</b>
            <b class="price">${formatRp(total)}</b>
          </div>
        </div>
      </div>

      <!-- Kode Voucher Promo -->
      <div class="card">
        <label class="lb" for="promo-inp" style="margin-top: 0">Punya Kode Promo / Voucher?</label>
        <div class="row">
          <input id="promo-inp" class="inp" type="text" placeholder="Gunakan kode: LEGALINHEMAT" value="${esc(paymentState.promoCode)}" style="margin: 0; text-transform: uppercase" data-action="promo-inp">
          <button class="btn sm sec" data-action="apply-promo">Gunakan</button>
        </div>
        ${paymentState.discount ? `<p style="color: var(--ok); font-size: 12px; margin-top: 6px; font-weight: 700">✓ Kupon LEGALINHEMAT berhasil memotong Rp 25.000!</p>` : ""}
      </div>

      <!-- Pilihan Metode Pembayaran Resmi -->
      <h2>Pilih Metode Pembayaran</h2>

      <div class="pay-opt ${paymentState.method === "qris" ? "active" : ""}" data-pay-method="qris">
        <span class="rad"></span>
        <div style="flex: 1">
          <b>QRIS (Scan Bank &amp; E-Wallet Instan)</b>
          <p class="mute" style="font-size: 12px">BCA, Mandiri, GoPay, OVO, ShopeePay, DANA</p>
        </div>
        <span class="tag ok">Otomatis</span>
      </div>

      <div class="pay-opt ${paymentState.method === "bca_va" ? "active" : ""}" data-pay-method="bca_va">
        <span class="rad"></span>
        <div style="flex: 1">
          <b>BCA Virtual Account</b>
          <p class="mute" style="font-size: 12px">Verifikasi otomatis 24 jam</p>
        </div>
      </div>

      <div class="pay-opt ${paymentState.method === "mandiri_va" ? "active" : ""}" data-pay-method="mandiri_va">
        <span class="rad"></span>
        <div style="flex: 1">
          <b>Mandiri Virtual Account</b>
          <p class="mute" style="font-size: 12px">Verifikasi otomatis via Livin Mandiri</p>
        </div>
      </div>

      <div class="pay-opt ${paymentState.method === "ewallet" ? "active" : ""}" data-pay-method="ewallet">
        <span class="rad"></span>
        <div style="flex: 1">
          <b>E-Wallet (GoPay, OVO, DANA)</b>
          <p class="mute" style="font-size: 12px">Kirim permintaan pembayaran ke nomor ponsel</p>
        </div>
      </div>

      <button class="btn" data-action="submit-payment" style="margin-top: 14px; padding: 14px">
        Bayar Sekarang ${formatRp(total)} →
      </button>
    `;
  }

  // STEP 2: MENUNGGU PEMBAYARAN (QRIS / VA DISPLAY)
  if (paymentState.step === "waiting") {
    let methodTitle = "QRIS Standar Nasional";
    let instructions = "";

    if (paymentState.method === "qris") {
      instructions = `
        <div class="qris-box">
          <p style="font-size: 12px; font-weight: 800; letter-spacing: 0.05em; color: var(--mute); margin-bottom: 6px">QRIS STANDAR PEMBAYARAN NASIONAL</p>
          ${generateQrisSvg()}
          <p style="font-size: 11.5px; color: var(--mute); margin-top: 8px">NMID: ID1024398129023 · LegalIn Platform</p>
        </div>
        <p class="mute" style="text-align: center; font-size: 13px">Buka aplikasi mobile banking atau e-wallet apa saja (BCA, Mandiri, GoPay, OVO, DANA) lalu scan kode di atas.</p>
      `;
    } else {
      const vaNumber = paymentState.method === "bca_va" ? "3901 0812 3456 7890" : "8870 0812 3456 7890";
      methodTitle = paymentState.method === "bca_va" ? "BCA Virtual Account" : "Mandiri Virtual Account";
      instructions = `
        <div class="card" style="text-align: center; padding: 20px">
          <p class="mute" style="font-size: 12px">Nomor Rekening Virtual Account:</p>
          <div class="va-display">${vaNumber}</div>
          <button class="btn sm sec" data-action="copy-va" data-va="${vaNumber}">Salin Nomor VA</button>
          <div style="text-align: left; margin-top: 14px; font-size: 12.5px; color: var(--mute)">
            <b>Cara Transfer:</b>
            <ol style="padding-left: 18px; margin: 4px 0">
              <li>Pilih menu <b>Transfer > Virtual Account</b> pada m-banking.</li>
              <li>Masukkan nomor VA di atas dan nominal <b>${formatRp(total)}</b>.</li>
              <li>Konfirmasi pembayaran dan simpan bukti transfer.</li>
            </ol>
          </div>
        </div>
      `;
    }

    return `
      <div style="text-align: center; padding: 10px 0">
        <span class="tag warn" style="font-size: 12px; padding: 4px 12px">Selesaikan Dalam 14:59 Menit</span>
        <h1 style="margin: 8px 0 4px">Selesaikan Pembayaran</h1>
        <p class="mute">${methodTitle}</p>
        <div class="price" style="font-size: 26px; margin: 10px 0">${formatRp(total)}</div>
      </div>

      ${instructions}

      <!-- Tombol Simulasi Berhasil -->
      <div style="margin-top: 20px">
        <button class="btn" data-action="simulate-payment-success">
          ${renderIcon("M5 13l4 4L19 7", 18)}
          Saya Sudah Membayar (Simulasikan Lunas)
        </button>
        <p class="mute" style="text-align: center; font-size: 11.5px; margin-top: 8px">
          *Pada versi aplikasi nyata, status lunas akan otomatis terdeteksi dalam 2-5 detik.
        </p>
      </div>
    `;
  }

  // STEP 3: BUKTI PEMBAYARAN / INVOICE DIGITAL RESMI
  if (paymentState.step === "success") {
    return `
      <div style="text-align: center; padding: 16px 0">
        <div style="background: var(--okbg); color: var(--ok); width: 68px; height: 68px; border-radius: 50%; display: grid; place-items: center; font-size: 32px; margin: 0 auto 12px">
          ✓
        </div>
        <h1>Pembayaran Berhasil!</h1>
        <p class="mute">Transaksi Anda telah diverifikasi dan dana tersimpan aman di Rekening Escrow.</p>
      </div>

      <!-- Kartu Invoice Resmi -->
      <div class="card" style="background: #FFFFFF; border: 1.5px solid var(--line); padding: 18px">
        <div class="row sp" style="border-bottom: 1.5px solid var(--line); padding-bottom: 10px; margin-bottom: 12px">
          <div>
            <b style="font-size: 15px; color: var(--pri)">LegalIn UMKM</b>
            <p class="mute" style="font-size: 11px">Bukti Tanda Terima Pembayaran</p>
          </div>
          <span class="tag ok">LUNAS / ESCROW PROTECTED</span>
        </div>

        <div class="rc"><span>Nomor Tagihan</span><b>${esc(paymentState.trxId)}</b></div>
        <div class="rc"><span>Waktu Transaksi</span><b>${esc(paymentState.paidTime)}</b></div>
        <div class="rc"><span>Layanan</span><b>${esc(item.title)}</b></div>
        <div class="rc"><span>Penyedia / Konsultan</span><b>${esc(item.sub)}</b></div>
        <div class="rc"><span>Metode Bayar</span><b>${paymentState.method.toUpperCase()}</b></div>
        <div class="rc" style="font-size: 15px; padding-top: 8px; border-top: 1px solid var(--line)">
          <b>Total Terbayar</b>
          <b class="price">${formatRp(total)}</b>
        </div>
      </div>

      <div class="row" style="margin-top: 14px">
        <button class="btn" data-action="go-to-booked-room">
          Masuk ke Ruang Sesi Temu →
        </button>
        <button class="btn sec" onclick="window.print()">
          Cetak Invoice
        </button>
      </div>
    `;
  }

  return "";
}

/* ==========================================================================
   VIEW 6: PENCARI KBLI OSS
   ========================================================================== */
function viewKbliFinder() {
  const categories = ["Semua", "Kuliner", "Kosmetik", "Fashion", "Jasa", "Online", "Distributor"];
  
  let list = KBLI_DATABASE;
  if (kbliCategory !== "Semua") {
    list = list.filter(k => k.cat === kbliCategory);
  }
  if (kbliSearchTerm.trim()) {
    const t = kbliSearchTerm.toLowerCase();
    list = list.filter(k => k.code.includes(t) || k.name.toLowerCase().includes(t) || k.desc.toLowerCase().includes(t));
  }

  let h = `
    <button class="back" data-go="home">← Beranda</button>
    <h1>Pencari Kode KBLI 2020 (OSS)</h1>
    <p class="mute" style="margin: 4px 0 12px">Pilih kode KBLI 5 digit yang tepat agar izin usahamu di OSS RBA tidak salah.</p>

    <label class="lb" for="kbli-inp" style="margin-top: 0">Cari nama usaha atau kode:</label>
    <input id="kbli-inp" class="inp" type="text" placeholder="Contoh: 56101, warung kopi, keripik, salon..." value="${esc(kbliSearchTerm)}" data-action="search-kbli">

    <div class="chips">
  `;

  categories.forEach(c => {
    h += `<button class="chip ${c === kbliCategory ? "on" : ""}" data-kbli-cat="${c}">${c}</button>`;
  });

  h += `</div><p class="mute" style="margin: 6px 0 12px">Ditemukan <b>${list.length}</b> kode KBLI:</p>`;

  if (!list.length) {
    h += `<div class="card"><p class="mute">Tidak ditemukan kode KBLI yang cocok. Coba kata kunci lain atau pilih kategori 'Semua'.</p></div>`;
  }

  list.forEach(k => {
    const isLow = k.risk.includes("Rendah");
    h += `
      <div class="card">
        <div class="row sp">
          <div>
            <span class="price" style="font-size: 19px">${k.code}</span>
            <span class="tag ${isLow ? "ok" : ""}" style="margin-left: 6px">Risiko ${k.risk}</span>
          </div>
          <button class="btn sm sec" data-copy-kbli="${k.code}">Salin Kode</button>
        </div>
        <h3 style="margin-top: 6px">${esc(k.name)}</h3>
        <p class="mute" style="margin: 4px 0 8px">${esc(k.desc)}</p>
        <div class="card" style="background: var(--card-alt); margin: 0; padding: 10px 12px">
          <p style="font-size: 12px; margin: 0"><b>Izin wajib yang diterbitkan:</b> ${esc(k.req)}</p>
        </div>
      </div>
    `;
  });

  return h;
}

/* ==========================================================================
   VIEW 7: DRAF KONTRAK RESMI
   ========================================================================== */
function viewKontrak() {
  const tpl = CONTRACT_TEMPLATES[selectedContractIndex];

  let h = `
    <button class="back" data-go="home">← Beranda</button>
    <h1>Generator Draf Kontrak Legal</h1>
    <p class="mute" style="margin: 4px 0 12px">Buat surat perjanjian resmi untuk reseller, karyawan, atau supplier usahamu.</p>

    <div class="chips">
  `;

  CONTRACT_TEMPLATES.forEach((c, idx) => {
    h += `<button class="chip ${idx === selectedContractIndex ? "on" : ""}" data-pick-contract="${idx}">${c.title}</button>`;
  });

  h += `
    </div>
    <div class="card">
      <h3>${tpl.title}</h3>
      <p class="mute" style="margin: 2px 0 12px">${tpl.desc}</p>
  `;

  tpl.fields.forEach(f => {
    const val = contractFormData[f.key] || "";
    h += `
      <label class="lb" for="fld-${f.key}">${f.label}</label>
      <input id="fld-${f.key}" class="inp" type="text" placeholder="${f.ph}" value="${esc(val)}" data-contract-field="${f.key}">
    `;
  });

  h += `
      <button class="btn" data-action="generate-contract" style="margin-top: 8px">
        ${renderIcon("M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", 18)}
        Buat Draf Kontrak
      </button>
    </div>
  `;

  if (generatedContractText) {
    h += `
      <h2>Pratinjau Draf Perjanjian Resmi</h2>
      <div class="card" style="background: #FFFDF9; border: 1.5px solid var(--line)">
        <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12.5px; line-height: 1.6; margin: 0; color: #222">${esc(generatedContractText)}</pre>
      </div>
      <div class="row">
        <button class="btn" onclick="window.print()">
          ${renderIcon("M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z", 18)}
          Cetak Dokumen (A4)
        </button>
        <button class="btn sec" data-action="save-contract-vault">
          Simpan ke Brankas
        </button>
      </div>
    `;
  }

  return h;
}

/* ==========================================================================
   VIEW 8: RUANG CHAT KONSULTAN & NOTULENSI
   ========================================================================== */
function viewConsultantRoom() {
  const session = S.sessions?.[activeConsultationIndex];
  if (!session) {
    return `
      <button class="back" data-go="jdw">← Jadwal Saya</button>
      <div class="card"><p class="mute">Sesi tidak ditemukan atau telah kedaluwarsa.</p></div>
    `;
  }

  const isCompleted = session.st === "selesai";

  let h = `
    <div class="row sp" style="margin-bottom: 8px">
      <button class="back" data-go="jdw" style="margin: 0">← Jadwal Temu</button>
      <span class="tag ${isCompleted ? "ok" : "warn"}">${isCompleted ? "Selesai" : "Sesi Aktif"}</span>
    </div>

    <!-- Info Sesi & Konsultan -->
    <div class="card row sp">
      <div class="row" style="gap: 12px">
        <img class="avatar-img" src="${session.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80"}" alt="${esc(session.who)}">
        <div>
          <h3>${esc(session.title)}</h3>
          <p class="mute">${formatDate(session.d)} · Slot: ${esc(session.slot || "09.00")} WIB · <b>${esc(session.fmt || "Chat")}</b></p>
        </div>
      </div>
      ${!isCompleted ? `<button class="btn sm sec" data-action="end-session">Selesaikan Sesi</button>` : ""}
    </div>

    <!-- Riwayat Chat -->
    <div id="room-chat-body" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px">
  `;

  (session.msgs || []).forEach(m => {
    const isUser = m[0] === "u";
    h += `
      <div class="mg ${isUser ? "u" : ""}">
        ${esc(m[1])}
      </div>
    `;
  });

  h += `</div>`;

  if (!isCompleted) {
    h += `
      <div class="card" style="padding: 12px">
        <label class="lb" for="room-msg-inp" style="margin-top: 0">Kirim pesan ke ${esc(session.who)}:</label>
        <div class="row">
          <input id="room-msg-inp" class="inp" type="text" placeholder="Tulis tanggapan atau pertanyaan..." style="margin: 0" data-action="room-type">
          <button class="btn sm" data-action="room-send" style="padding: 12px 18px">Kirim</button>
        </div>
        <div class="row" style="margin-top: 8px">
          <label class="btn sm sec" style="margin: 0; cursor: pointer">
            ${renderIcon("M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13", 16)}
            Lampirkan Berkas Mock
            <input type="file" hidden data-action="room-attach">
          </label>
        </div>
      </div>
    `;
  } else {
    h += `
      <div class="card" style="background: var(--okbg); border: 1px solid var(--ok)">
        <h3 style="color: var(--ok)">✓ Sesi Selesai &amp; Notulensi Resmi Terbit</h3>
        <p class="mute" style="margin: 4px 0 10px">Hasil peninjauan hukum telah diverifikasi dan siap diunduh.</p>
        <div class="row">
          <button class="btn sm" data-action="view-session-note">Buka &amp; Cetak Notulensi</button>
          <button class="btn sm sec" data-action="save-note-vault">Simpan ke Brankas</button>
        </div>
      </div>
    `;
  }

  return h;
}

/* ==========================================================================
   VIEW 9: BRANKAS DOKUMEN & PENGINGAT
   ========================================================================== */
function viewDokumen() {
  let h = `
    <h1>Brankas Digital & Pengingat</h1>
    <p class="mute" style="margin: 4px 0 12px">Simpan salinan resmi KTP, NPWP, NIB, dan sertifikat halal usahamu di satu tempat aman.</p>

    <div class="seg">
      <button class="${vaultSubTab === "b" ? "on" : ""}" data-vault-tab="b">Brankas Dokumen (${(S.docs || []).length})</button>
      <button class="${vaultSubTab === "p" ? "on" : ""}" data-vault-tab="p">Pengingat Masa Berlaku (${(S.rem || []).length})</button>
    </div>
  `;

  if (vaultSubTab === "b") {
    if (isAddingDoc) {
      h += `
        <div class="card">
          <h3>Tambah Dokumen Baru</h3>
          <p class="mute" style="margin-bottom: 8px">Pilih jenis dokumen yang ingin disimpan:</p>
          <div class="chips" style="flex-wrap: wrap">
            ${DOCUMENT_TYPES.map((t, idx) => `
              <button class="chip ${newDocForm.type === idx ? "on" : ""}" data-doc-type="${idx}">${t[2]} ${t[1]}</button>
            `).join("")}
          </div>

          <label class="lb" for="doc-name">Nama Dokumen</label>
          <input id="doc-name" class="inp" type="text" placeholder="Contoh: NIB Usaha 2026" value="${esc(newDocForm.name)}" data-action="doc-name-inp">

          <label class="lb" for="doc-exp">Masa Berlaku (Kosongkan jika seumur hidup)</label>
          <input id="doc-exp" class="inp" type="date" value="${esc(newDocForm.exp)}" data-action="doc-exp-inp">

          <label class="lb" for="doc-file">Lampiran File (Simulasi)</label>
          <input id="doc-file" class="inp" type="file" data-action="doc-file-inp">

          <div class="row" style="margin-top: 10px">
            <button class="btn" data-action="save-new-doc">Simpan Dokumen</button>
            <button class="btn sec" data-action="cancel-add-doc">Batal</button>
          </div>
        </div>
      `;
    } else {
      h += `
        <button class="btn" data-action="start-add-doc" style="margin-bottom: 12px">
          + Tambah Dokumen Usaha
        </button>
      `;
    }

    if (!S.docs || !S.docs.length) {
      h += `<div class="card"><p class="mute">Brankas masih kosong. Simpan salinan dokumen penting usahamu di sini.</p></div>`;
    } else {
      S.docs.forEach(d => {
        const diff = daysDiff(d.exp);
        let tag = `<span class="tag ok">Berlaku Seumur Hidup</span>`;
        if (d.exp) {
          if (diff < 0) tag = `<span class="tag bad">Kedaluwarsa ${-diff} hari lalu</span>`;
          else if (diff <= 30) tag = `<span class="tag warn">Habis dalam ${diff} hari</span>`;
          else tag = `<span class="tag ok">Berlaku s.d. ${formatDate(d.exp)}</span>`;
        }

        h += `
          <div class="card">
            <div class="row sp">
              <div class="row" style="min-width: 0; gap: 12px">
                <div style="background: var(--card-alt); color: var(--pri); width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-weight: 800; font-size: 14px; flex: none; border: 1px solid var(--line)">
                  ${DOCUMENT_TYPES[d.type] ? DOCUMENT_TYPES[d.type][2] : "DK"}
                </div>
                <div style="min-width: 0">
                  <h3>${esc(d.name)}</h3>
                  <p class="mute" style="font-size: 11.5px">Ditambahkan: ${formatDate(d.added)} ${d.file ? "· " + esc(d.file) : ""}</p>
                </div>
              </div>
              <button class="btn sm sec" data-del-doc="${d.id}" aria-label="Hapus dokumen">✕</button>
            </div>
            <div class="row sp" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--line)">
              ${tag}
              <button class="btn sm sec" data-action="preview-mock-doc">Lihat Berkas</button>
            </div>
          </div>
        `;
      });
    }
  } else {
    h += `
      <div class="card">
        <h3>Atur Pengingat Otomatis</h3>
        <p class="mute" style="margin: 2px 0 8px">Ingatkan sebelum masa izin/dokumen habis:</p>
        <div class="chips">
          ${[30, 14, 7].map(days => `
            <button class="chip ${S.lead === days ? "on" : ""}" data-set-lead="${days}">${days} Hari Sebelumnya</button>
          `).join("")}
        </div>
      </div>

      <h2>Simulasi Bot WhatsApp Pengingat</h2>
      <div class="card" style="background: #F0FDF4; border: 1px solid #BBF7D0">
        <div class="row" style="margin-bottom: 8px">
          <span style="font-size: 20px">💬</span>
          <div>
            <b>WhatsApp Business Notification</b>
            <p class="mute" style="font-size: 11.5px">Nomor tujuan: ${esc(S.user ? S.user.phone : "0812-3456-7890")}</p>
          </div>
        </div>
        <div class="card" style="background: #FFFFFF; padding: 12px 14px; margin: 0">
          <p style="font-size: 13px; line-height: 1.45; margin: 0">
            "Halo <b>${esc(S.user ? S.user.biz : "Pelaku UMKM")}</b>! P-IRT usahamu akan habis dalam <b>${daysDiff("2026-11-20")} hari</b>. Segera ajukan perpanjangan ke Dinas Kesehatan atau minta pendampingan konsultan di LegalIn."
          </p>
        </div>
        <button class="btn sm" data-action="simulate-wa-reply" style="margin-top: 10px">Kirim Notifikasi Uji</button>
      </div>
    `;
  }

  return h;
}

/* ==========================================================================
   VIEW 10: PROFIL USAHA & PENGATURAN
   ========================================================================== */
function viewProfil() {
  const u = S.user || {};

  return `
    <button class="back" data-go="home">← Beranda</button>
    <h1>Profil Usaha & Akun</h1>

    <div class="card">
      <div class="row" style="gap: 14px; margin-bottom: 14px">
        <img class="avatar-img lg" src="${u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80"}" alt="${esc(u.owner)}">
        <div>
          <h3>${esc(u.biz || "Usaha Saya")}</h3>
          <p class="mute">${esc(u.owner || "Pemilik")} · ${esc(u.city || "Solo")}</p>
          <span class="tag ok" style="margin-top: 4px">Akun UMKM Terverifikasi</span>
        </div>
      </div>

      <label class="lb" for="p-biz">Nama Usaha / Merek</label>
      <input id="p-biz" class="inp" type="text" value="${esc(u.biz || "")}" data-action="p-biz-inp">

      <label class="lb" for="p-owner">Nama Pemilik Usaha</label>
      <input id="p-owner" class="inp" type="text" value="${esc(u.owner || "")}" data-action="p-owner-inp">

      <label class="lb" for="p-phone">Nomor WhatsApp Aktif</label>
      <input id="p-phone" class="inp" type="text" value="${esc(u.phone || "")}" data-action="p-phone-inp">

      <label class="lb" for="p-city">Kota Domisili Usaha</label>
      <input id="p-city" class="inp" type="text" value="${esc(u.city || "Solo")}" data-action="p-city-inp">

      <button class="btn" data-action="save-profile" style="margin-top: 8px">Simpan Perubahan</button>
    </div>

    <h2>Koneksi Gemini AI API (Opsional)</h2>
    <div class="card">
      <p class="mute" style="margin-bottom: 8px">
        Asisten AI LegalIn secara default berjalan offline. Masukkan Gemini API Key jika ingin respons AI generasi langsung.
      </p>
      <label class="lb" for="api-key-inp">Gemini API Key:</label>
      <input id="api-key-inp" class="inp" type="password" placeholder="AIzaSy..." value="${esc(S.apiKey || "")}">
      <button class="btn sm sec" data-action="save-api-key">Simpan Kunci API</button>
    </div>

    <h2>Kelola Data Prototipe</h2>
    <div class="card">
      <p class="mute" style="margin-bottom: 12px">Reset atau muat ulang data demo untuk demonstrasi.</p>
      <div class="row">
        <button class="btn sm" data-action="reset-to-demo">Muat Ulang Data Demo</button>
        <button class="btn sm sec" data-action="reset-to-blank">Kosongkan Data</button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   VIEW 11: NOTULENSI RESMI CETAK (A4 VIEW)
   ========================================================================== */
function viewNotes() {
  const session = activeNoteSession || S.sessions?.[0];
  if (!session) return viewConsultantRoom();

  const notesText = window.LegalInConsultant.generateSessionNotes(session, S);

  return `
    <button class="back" data-go="room">← Kembali ke Ruang Chat</button>
    <div class="row sp" style="margin-bottom: 12px">
      <h1>Lembar Notulensi Resmi</h1>
      <button class="btn sm" onclick="window.print()">
        ${renderIcon("M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z", 16)}
        Cetak Dokumen
      </button>
    </div>

    <div class="card" style="background: #FFFFFF; border: 1.5px solid var(--line); padding: 22px">
      <pre style="white-space: pre-wrap; font-family: monospace; font-size: 13px; line-height: 1.6; color: #111; margin: 0">${esc(notesText)}</pre>
    </div>
  `;
}

/* ==========================================================================
   ROUTER UTAMA & ENGINE RENDER
   ========================================================================== */
function renderApp() {
  const viewMap = {
    home: viewHome,
    cek: viewCekIzin,
    kbli: viewKbliFinder,
    kontrak: viewKontrak,
    konsul: viewKonsultan,
    book: viewBooking,
    pay: viewPayment,
    room: viewConsultantRoom,
    dok: viewDokumen,
    prof: viewProfil,
    notes: viewNotes,
    jdw: () => {
      let h = `
        <button class="back" data-go="home">← Beranda</button>
        <h1>Jadwal Temu Saya</h1>
        <p class="mute" style="margin: 4px 0 12px">Daftar agenda temu konsultan aktif dan riwayat notulensi Anda.</p>
      `;
      if (!S.sessions || !S.sessions.length) {
        h += `<div class="card"><p class="mute">Belum ada jadwal temu aktif. Silakan pilih ahli di menu Temu Konsultan.</p></div>`;
      } else {
        S.sessions.forEach((s, idx) => {
          const isDone = s.st === "selesai";
          h += `
            <div class="card">
              <div class="row sp">
                <div class="row" style="gap: 12px">
                  <img class="avatar-img" src="${s.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80"}" alt="${esc(s.who)}">
                  <div>
                    <h3>${esc(s.title)}</h3>
                    <p class="mute">${formatDate(s.d)} · Slot ${esc(s.slot || "09.00")} WIB · <b>${esc(s.fmt || "Chat")}</b></p>
                  </div>
                </div>
                <span class="tag ${isDone ? "ok" : "warn"}">${isDone ? "Selesai" : "Akan Datang"}</span>
              </div>
              <div class="row sp" style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed var(--line)">
                <span class="price">${formatRp(s.pr)}</span>
                <button class="btn sm" data-room="${idx}">
                  ${isDone ? "Lihat Notulensi" : "Buka Ruang Sesi"}
                </button>
              </div>
            </div>
          `;
        });
      }
      return h;
    },
    paket: () => {
      let h = `
        <button class="back" data-go="home">← Beranda</button>
        <h1>Paket Pengurusan Legalitas</h1>
        <p class="mute" style="margin: 4px 0 12px">Urus perizinan sampai terbit resmi dengan sistem pembayaran escrow bergaransi.</p>
      `;
      PACKAGES.forEach(pk => {
        h += `
          <div class="card">
            <div class="row sp">
              <span class="price" style="font-size: 19px">${formatRp(pk.p)}</span>
              <span class="tag ok">Estimasi ${esc(pk.dur)}</span>
            </div>
            <h3 style="margin-top: 6px; font-size: 16px">${esc(pk.n)}</h3>
            <p class="mute" style="margin: 2px 0 6px">Mitra: ${esc(pk.provider)}</p>
            <p style="font-size: 13px; line-height: 1.45; color: var(--ink-sec)">${esc(pk.t)}</p>
            <div class="card" style="background: var(--card-alt); margin: 8px 0; padding: 10px 12px">
              <p style="font-size: 12px; margin: 0"><b>Tahapan Escrow:</b> ${pk.m.join(" → ")}</p>
            </div>
            <button class="btn sm" data-buy-package="${pk.id}">Pilih Paket Ini</button>
          </div>
        `;
      });
      return h;
    },
    pajak: () => {
      const omzet = 600000000;
      const taxable = Math.max(0, omzet - 500000000);
      const taxDue = taxable * 0.005;
      return `
        <button class="back" data-go="home">← Beranda</button>
        <h1>Kalkulator Pajak UMKM (PP 55/2022)</h1>
        <p class="mute" style="margin: 4px 0 12px">Simulasi PPh Final 0,5% untuk pelaku usaha mikro & kecil.</p>
        <div class="card">
          <label class="lb" for="omzet-calc">Omzet Usaha per Tahun (Rp):</label>
          <input id="omzet-calc" class="inp" type="number" value="${omzet}">
          <div class="rc"><span>Peredaran Bruto</span><b>${formatRp(omzet)}</b></div>
          <div class="rc"><span>Batas Bebas Pajak (PTKP Orang Pribadi)</span><b>Rp 500.000.000</b></div>
          <div class="rc"><span>Omzet Dikenai Pajak</span><b>${formatRp(taxable)}</b></div>
          <div class="rc" style="border-top: 1px solid var(--line); padding-top: 8px">
            <b>PPh Final 0,5% Terutang</b>
            <b class="price">${formatRp(taxDue)} / tahun</b>
          </div>
        </div>
      `;
    }
  };

  const renderFunc = viewMap[currentTab] || viewHome;
  const content = renderFunc();

  $("#app-content").innerHTML = content;

  // Navigasi Bar Bawah
  const navItems = [
    { id: "home", label: "Beranda", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "cek", label: "Cek Izin", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "kbli", label: "KBLI", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { id: "konsul", label: "Konsultan", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { id: "dok", label: "Brankas", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" }
  ];

  let navHtml = "";
  navItems.forEach(item => {
    const isCurrent = currentTab === item.id;
    navHtml += `
      <button class="${isCurrent ? "on" : ""}" data-go="${item.id}">
        ${renderIcon(item.icon, 20)}
        <span>${item.label}</span>
      </button>
    `;
  });

  $("#nav-bar").innerHTML = navHtml;
}

/* ==========================================================================
   LOGIKA INTERAKTIF AI CHATBOT (DRAWER & MODAL)
   ========================================================================== */
function openAiModal(initialQuery = null) {
  const modal = $("#ai-modal");
  if (!modal) return;
  modal.classList.add("active");

  const body = $("#ai-chat-body");
  if (!window.LegalInAI.history.length) {
    const greeting = window.LegalInAI.getInitialGreeting(S);
    window.LegalInAI.history.push({ sender: "bot", text: greeting, time: new Date() });
  }

  renderAiMessages();
  renderAiChips();

  if (initialQuery) {
    handleAiSend(initialQuery);
  }
}

function closeAiModal() {
  const modal = $("#ai-modal");
  if (modal) modal.classList.remove("active");
}

function renderAiMessages() {
  const body = $("#ai-chat-body");
  if (!body) return;

  let h = "";
  window.LegalInAI.history.forEach(m => {
    const isBot = m.sender === "bot";
    let text = esc(m.text)
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.*?)\*/g, "<i>$1</i>")
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n- /g, "<br>• ")
      .replace(/\n/g, "<br>");

    h += `
      <div class="mg ${isBot ? "bot" : "u"}">
        ${text}
      </div>
    `;
  });

  if (window.LegalInAI.isTyping) {
    h += `
      <div class="mg bot typing">
        <span></span><span></span><span></span>
      </div>
    `;
  }

  body.innerHTML = h;
  body.scrollTop = body.scrollHeight;
}

function renderAiChips() {
  const container = $("#ai-quick-chips");
  if (!container) return;
  const chips = window.LegalInAI.getQuickPrompts(S);
  container.innerHTML = chips.map(c => `<button class="ai-chip" data-ai-prompt="${esc(c)}">${esc(c)}</button>`).join("");
}

async function handleAiSend(query) {
  const q = (query || "").trim();
  if (!q) return;

  window.LegalInAI.isTyping = true;
  renderAiMessages();

  try {
    await window.LegalInAI.ask(q, S);
  } catch (err) {
    console.error("Gagal mengirim pesan AI:", err);
  } finally {
    window.LegalInAI.isTyping = false;
    renderAiMessages();
  }
}

/* ==========================================================================
   EVENT DELEGATION GLOBAL PADA DOCUMENT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initState();
  renderApp();

  // Floating Action Button AI
  const fab = $("#ai-fab");
  if (fab) {
    fab.addEventListener("click", () => openAiModal());
  }

  // Tombol Tutup AI Modal
  const closeBtn = $("#close-ai-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeAiModal);
  }

  // Input Pesan AI
  const aiSendBtn = $("#ai-send-btn");
  const aiInput = $("#ai-user-inp");
  if (aiSendBtn && aiInput) {
    const doSend = () => {
      const text = aiInput.value;
      if (text.trim()) {
        aiInput.value = "";
        handleAiSend(text);
      }
    };
    aiSendBtn.addEventListener("click", doSend);
    aiInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSend();
      }
    });
  }

  // Event Delegation Klik Global
  document.addEventListener("click", (e) => {
    // 1. Navigasi Tab
    const goEl = e.target.closest("[data-go]");
    if (goEl) {
      navigateTo(goEl.dataset.go);
      return;
    }

    // 2. Buka Modal AI
    if (e.target.closest("[data-action='open-ai']")) {
      openAiModal();
      return;
    }

    // 3. AI Quick Prompt Chip
    const chipEl = e.target.closest("[data-ai-prompt]");
    if (chipEl) {
      handleAiSend(chipEl.dataset.aiPrompt);
      return;
    }

    // 4. Eskalasi AI ke Konsultan Manusia
    if (e.target.closest("[data-action='escalate-ai']")) {
      const lastUserMsg = window.LegalInAI.history.filter(m => m.sender === "user").slice(-1)[0]?.text || "Perlindungan Merek & Legalitas";
      closeAiModal();
      const newSession = window.LegalInConsultant.createEscalatedBooking(lastUserMsg, S);
      saveState();
      activeConsultationIndex = 0;
      navigateTo("room");
      showToast("Dialihkan ke Konsultan Ahli: " + newSession.who);
      return;
    }

    // 5. Cek Izin: Jawab Wizard
    const ansEl = e.target.closest("[data-wz-ans]");
    if (ansEl) {
      const q = LEGAL_QUESTIONS[wizardStep];
      wizardAnswers[q.k] = ansEl.dataset.wzAns;
      wizardStep++;
      if (wizardStep >= LEGAL_QUESTIONS.length) {
        S.biz = wizardAnswers;
        S.done = {};
        saveState();
        showToast("Rekomendasi izin siap!");
      }
      renderApp();
      return;
    }
    if (e.target.closest("[data-wz-back]")) {
      if (wizardStep > 0) wizardStep--;
      renderApp();
      return;
    }
    const chkEl = e.target.closest("[data-toggle-rule]");
    if (chkEl) {
      const id = chkEl.dataset.toggleRule;
      S.done = S.done || {};
      S.done[id] = !S.done[id];
      saveState();
      renderApp();
      return;
    }
    if (e.target.closest("[data-redo-wizard]")) {
      S.biz = null;
      wizardStep = 0;
      wizardAnswers = {};
      saveState();
      renderApp();
      return;
    }

    // 6. Pencari KBLI
    const kbliCatEl = e.target.closest("[data-kbli-cat]");
    if (kbliCatEl) {
      kbliCategory = kbliCatEl.dataset.kbliCat;
      renderApp();
      return;
    }
    const copyKbliEl = e.target.closest("[data-copy-kbli]");
    if (copyKbliEl) {
      navigator.clipboard?.writeText(copyKbliEl.dataset.copyKbli);
      showToast("Kode KBLI " + copyKbliEl.dataset.copyKbli + " disalin!");
      return;
    }

    // 7. Draf Kontrak
    const pickContractEl = e.target.closest("[data-pick-contract]");
    if (pickContractEl) {
      selectedContractIndex = Number(pickContractEl.dataset.pickContract);
      contractFormData = {};
      generatedContractText = "";
      renderApp();
      return;
    }
    if (e.target.closest("[data-action='generate-contract']")) {
      const tpl = CONTRACT_TEMPLATES[selectedContractIndex];
      generatedContractText = tpl.generate(contractFormData);
      renderApp();
      showToast("Draf perjanjian berhasil dibuat!");
      return;
    }
    if (e.target.closest("[data-action='save-contract-vault']")) {
      const tpl = CONTRACT_TEMPLATES[selectedContractIndex];
      S.docs = S.docs || [];
      S.docs.unshift({
        id: Date.now(),
        type: 6,
        name: tpl.title + " - Draf Resmi",
        exp: "",
        file: "draf-" + tpl.id + ".pdf",
        added: new Date().toISOString().split("T")[0]
      });
      saveState();
      showToast("Draf kontrak disimpan di Brankas!");
      return;
    }

    // 8. Konsultan: Pilih Tipe & Kota
    const konsulTypeEl = e.target.closest("[data-konsul-type]");
    if (konsulTypeEl) {
      consultantType = konsulTypeEl.dataset.konsulType;
      renderApp();
      return;
    }
    const konsulCityEl = e.target.closest("[data-konsul-city]");
    if (konsulCityEl) {
      consultantCity = konsulCityEl.dataset.konsulCity;
      renderApp();
      return;
    }

    // Mulai Booking Konsultan
    const startBookEl = e.target.closest("[data-start-booking]");
    if (startBookEl) {
      activeBooking = {
        i: Number(startBookEl.dataset.startBooking),
        fmtIdx: 0,
        topicIdx: 0,
        dayIdx: 0,
        slotIdx: 0,
        notes: ""
      };
      navigateTo("book");
      return;
    }

    // Opsi Booking Jadwal
    const bFmtEl = e.target.closest("[data-booking-fmt]");
    if (bFmtEl) {
      activeBooking.fmtIdx = Number(bFmtEl.dataset.bookingFmt);
      renderApp();
      return;
    }
    const bTopicEl = e.target.closest("[data-booking-topic]");
    if (bTopicEl) {
      activeBooking.topicIdx = Number(bTopicEl.dataset.bookingTopic);
      renderApp();
      return;
    }
    const bDayEl = e.target.closest("[data-booking-day]");
    if (bDayEl) {
      activeBooking.dayIdx = Number(bDayEl.dataset.bookingDay);
      renderApp();
      return;
    }
    const bSlotEl = e.target.closest("[data-booking-slot]");
    if (bSlotEl) {
      activeBooking.slotIdx = Number(bSlotEl.dataset.bookingSlot);
      renderApp();
      return;
    }

    // Lanjut ke Checkout Pembayaran
    if (e.target.closest("[data-action='go-to-checkout']")) {
      const c = CONSULTANTS[activeBooking.i];
      const slot = ["09.00", "10.30", "13.30", "15.00", "16.30", "19.00"][activeBooking.slotIdx];
      const topic = c.topics[activeBooking.topicIdx];
      const fmts = ["Chat Aplikasi & Berkas", "Video Call (Google Meet)", "Tatap Muka di Kantor (" + c.city + ")"];
      const fmt = fmts[activeBooking.fmtIdx];

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + activeBooking.dayIdx + 1);

      paymentState.item = {
        kind: "konsul",
        id: c.id,
        title: "Sesi Temu dengan " + c.name,
        sub: topic + " · " + targetDate.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }) + ", " + slot + " WIB (" + fmt + ")",
        price: c.rate,
        consultant: c,
        slot: slot,
        dateIso: targetDate.toISOString().split("T")[0],
        topic: topic,
        fmt: fmt
      };
      paymentState.step = "checkout";
      paymentState.discount = 0;
      paymentState.promoCode = "";
      navigateTo("pay");
      return;
    }

    // 9. Sistem Pembayaran: Pilih Metode Bayar
    const payMethodEl = e.target.closest("[data-pay-method]");
    if (payMethodEl) {
      paymentState.method = payMethodEl.dataset.payMethod;
      renderApp();
      return;
    }

    // Terapkan Kupon Promo
    if (e.target.closest("[data-action='apply-promo']")) {
      const inp = $("#promo-inp");
      const code = (inp ? inp.value : "").trim().toUpperCase();
      if (code === "LEGALINHEMAT") {
        paymentState.discount = 25000;
        paymentState.promoCode = code;
        showToast("Kupon LEGALINHEMAT berhasil digunakan!");
      } else {
        paymentState.discount = 0;
        showToast("Kode promo tidak valid. Coba: LEGALINHEMAT");
      }
      renderApp();
      return;
    }

    // Ajukan Pembayaran (Pindah ke Waiting)
    if (e.target.closest("[data-action='submit-payment']")) {
      paymentState.step = "waiting";
      renderApp();
      window.scrollTo(0, 0);
      return;
    }

    // Salin VA
    const copyVaEl = e.target.closest("[data-action='copy-va']");
    if (copyVaEl) {
      const va = copyVaEl.dataset.va;
      navigator.clipboard?.writeText(va.replace(/\s/g, ""));
      showToast("Nomor Virtual Account disalin!");
      return;
    }

    // Simulasi Pembayaran Berhasil
    if (e.target.closest("[data-action='simulate-payment-success']")) {
      paymentState.step = "success";
      paymentState.trxId = "LGI-INV" + Math.floor(100000 + Math.random() * 900000);
      paymentState.paidTime = new Date().toLocaleString("id-ID");

      const it = paymentState.item;
      if (it.kind === "konsul") {
        // Buat sesi baru
        const newSes = {
          id: "SES-" + Date.now().toString().slice(-6),
          title: it.title,
          who: it.consultant.name,
          avatar: it.consultant.avatar,
          topic: it.topic,
          d: it.dateIso,
          slot: it.slot,
          fmt: it.fmt,
          st: "akan",
          pr: it.price,
          trx: paymentState.trxId,
          i: CONSULTANTS.indexOf(it.consultant),
          msgs: [
            ["k", window.LegalInConsultant.getConsultantReply({ topic: it.topic, msgs: [] })]
          ]
        };
        S.sessions = S.sessions || [];
        S.sessions.unshift(newSes);
        activeConsultationIndex = 0;
      } else {
        S.order = { id: it.id, s: 0, trx: paymentState.trxId };
      }

      // Tambahkan bukti pembayaran ke Brankas
      S.docs = S.docs || [];
      S.docs.unshift({
        id: Date.now(),
        type: 7,
        name: "Bukti Bayar: " + it.title,
        exp: "",
        file: paymentState.trxId + ".pdf",
        added: new Date().toISOString().split("T")[0]
      });

      saveState();
      renderApp();
      showToast("Pembayaran berhasil & bukti bayar tersimpan!");
      window.scrollTo(0, 0);
      return;
    }

    // Lanjut ke Ruang Sesi yang Baru Dibayar
    if (e.target.closest("[data-action='go-to-booked-room']")) {
      if (paymentState.item?.kind === "konsul") {
        activeConsultationIndex = 0;
        navigateTo("room");
      } else {
        navigateTo("home");
      }
      return;
    }

    // Paket Langsung Beli
    const buyPkgEl = e.target.closest("[data-buy-package]");
    if (buyPkgEl) {
      const pk = PACKAGES.find(p => p.id === buyPkgEl.dataset.buyPackage);
      if (pk) {
        paymentState.item = {
          kind: "paket",
          id: pk.id,
          title: pk.n,
          sub: pk.provider + " · " + pk.t,
          price: pk.p
        };
        paymentState.step = "checkout";
        paymentState.discount = 0;
        paymentState.promoCode = "";
        navigateTo("pay");
      }
      return;
    }

    // 10. Ruang Chat Konsultan
    const roomEl = e.target.closest("[data-room]");
    if (roomEl) {
      activeConsultationIndex = Number(roomEl.dataset.room);
      navigateTo("room");
      return;
    }
    if (e.target.closest("[data-action='room-send']")) {
      const inp = $("#room-msg-inp");
      if (!inp || !inp.value.trim()) return;
      const text = inp.value.trim();
      inp.value = "";

      const ses = S.sessions[activeConsultationIndex];
      ses.msgs.push(["u", text]);
      renderApp();

      setTimeout(() => {
        const reply = window.LegalInConsultant.getConsultantReply(ses);
        ses.msgs.push(["k", reply]);
        saveState();
        renderApp();
      }, 700);
      return;
    }
    if (e.target.closest("[data-action='end-session']")) {
      const ses = S.sessions[activeConsultationIndex];
      ses.st = "selesai";
      saveState();
      renderApp();
      showToast("Sesi selesai! Notulensi resmi diterbitkan.");
      return;
    }
    if (e.target.closest("[data-action='view-session-note']")) {
      activeNoteSession = S.sessions[activeConsultationIndex];
      navigateTo("notes");
      return;
    }
    if (e.target.closest("[data-action='save-note-vault']")) {
      const ses = S.sessions[activeConsultationIndex];
      S.docs = S.docs || [];
      S.docs.unshift({
        id: Date.now(),
        type: 6,
        name: "Notulensi Resmi: " + ses.title,
        exp: "",
        file: "notulensi-" + (ses.trx || "sesi") + ".pdf",
        added: new Date().toISOString().split("T")[0]
      });
      saveState();
      showToast("Notulensi resmi berhasil disimpan ke Brankas!");
      return;
    }

    // 11. Brankas & Dokumen
    const vaultTabEl = e.target.closest("[data-vault-tab]");
    if (vaultTabEl) {
      vaultSubTab = vaultTabEl.dataset.vaultTab;
      renderApp();
      return;
    }
    if (e.target.closest("[data-action='start-add-doc']")) {
      isAddingDoc = true;
      newDocForm = { type: 0, name: "", exp: "", file: "" };
      renderApp();
      return;
    }
    if (e.target.closest("[data-action='cancel-add-doc']")) {
      isAddingDoc = false;
      renderApp();
      return;
    }
    const docTypeEl = e.target.closest("[data-doc-type]");
    if (docTypeEl) {
      newDocForm.type = Number(docTypeEl.dataset.docType);
      renderApp();
      return;
    }
    if (e.target.closest("[data-action='save-new-doc']")) {
      const name = newDocForm.name.trim() || (DOCUMENT_TYPES[newDocForm.type] ? DOCUMENT_TYPES[newDocForm.type][1] : "Dokumen Usaha");
      S.docs = S.docs || [];
      S.docs.unshift({
        id: Date.now(),
        type: newDocForm.type,
        name: name,
        exp: newDocForm.exp || "",
        file: newDocForm.file || "dokumen.pdf",
        added: new Date().toISOString().split("T")[0]
      });
      isAddingDoc = false;
      saveState();
      renderApp();
      showToast("Dokumen disimpan di Brankas!");
      return;
    }
    const delDocEl = e.target.closest("[data-del-doc]");
    if (delDocEl) {
      const id = Number(delDocEl.dataset.delDoc);
      S.docs = (S.docs || []).filter(d => d.id !== id);
      saveState();
      renderApp();
      showToast("Dokumen dihapus dari Brankas.");
      return;
    }
    if (e.target.closest("[data-action='preview-mock-doc']")) {
      showToast("Pratinjau berkas digital (Simulasi PDF).");
      return;
    }
    if (e.target.closest("[data-action='simulate-wa-reply']")) {
      showToast("Pesan WhatsApp pengingat uji berhasil dikirim!");
      return;
    }

    // 12. Profil & Reset
    if (e.target.closest("[data-action='save-profile']")) {
      S.user = S.user || {};
      const b = $("#p-biz")?.value;
      const o = $("#p-owner")?.value;
      const p = $("#p-phone")?.value;
      const c = $("#p-city")?.value;
      if (b) S.user.biz = b.trim();
      if (o) S.user.owner = o.trim();
      if (p) S.user.phone = p.trim();
      if (c) S.user.city = c.trim();
      saveState();
      showToast("Profil usaha berhasil diperbarui!");
      return;
    }
    if (e.target.closest("[data-action='save-api-key']")) {
      const k = $("#api-key-inp")?.value;
      S.apiKey = (k || "").trim();
      saveState();
      showToast("Gemini API Key tersimpan!");
      return;
    }
    if (e.target.closest("[data-action='reset-to-demo']")) {
      resetToDemo();
      return;
    }
    if (e.target.closest("[data-action='reset-to-blank']")) {
      resetToBlank();
      return;
    }
  });

  // Event Input Global
  document.addEventListener("input", (e) => {
    if (e.target.dataset.action === "search-kbli") {
      kbliSearchTerm = e.target.value;
      renderApp();
      const inp = $("#kbli-inp");
      if (inp) {
        inp.focus();
        inp.selectionStart = inp.selectionEnd = inp.value.length;
      }
    } else if (e.target.dataset.contractField) {
      contractFormData[e.target.dataset.contractField] = e.target.value;
    } else if (e.target.dataset.action === "doc-name-inp") {
      newDocForm.name = e.target.value;
    } else if (e.target.dataset.action === "doc-exp-inp") {
      newDocForm.exp = e.target.value;
    } else if (e.target.dataset.action === "booking-notes-inp") {
      if (activeBooking) activeBooking.notes = e.target.value;
    } else if (e.target.dataset.action === "promo-inp") {
      paymentState.promoCode = e.target.value;
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.dataset.action === "doc-file-inp") {
      const f = e.target.files?.[0];
      if (f) newDocForm.file = f.name;
    } else if (e.target.dataset.action === "room-attach") {
      const f = e.target.files?.[0];
      if (f && S.sessions?.[activeConsultationIndex]) {
        S.sessions[activeConsultationIndex].msgs.push(["u", "[Lampiran Berkas: " + f.name + "]"]);
        saveState();
        renderApp();
      }
    }
  });
});

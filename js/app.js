/**
 * app.js - Logika Utama, Router, State Management, & Renderer LegalIn UMKM
 */

// State Aplikasi Global
let S = null;
let currentTab = "home";
let activeBooking = null; // Data sementara booking konsultan
let activePayment = null; // Data sementara pembayaran
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
let newReminderForm = { t: "", d: "" };
let deleteConfirmId = null;

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

function renderIcon(d, size = 24) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
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
  const user = S.user || { biz: "Pelaku UMKM" };
  const rules = S.biz ? generateLegalRules(S.biz) : [];
  const completedCount = rules.filter(r => S.done && S.done[r.id]).length;
  const progressPct = rules.length ? Math.round((completedCount / rules.length) * 100) : 0;

  let h = `
    <div class="row sp" style="margin-bottom: 8px">
      <div>
        <p class="mute">Halo, <b>${esc(user.biz)}</b></p>
        <h1>Urus izin usaha tanpa pusing</h1>
      </div>
      <button class="btn sm sec" data-go="prof" aria-label="Buka Profil Usaha" style="border-radius: 50%; width: 42px; height: 42px; padding: 0">
        ${renderIcon("M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-5 5-7 8-7s7 2 8 7", 20)}
      </button>
    </div>

    <!-- Banner Cek Izin Hero -->
    <div class="hero">
      <svg class="art" viewBox="0 0 120 100" aria-hidden="true">
        <rect x="6" y="62" width="22" height="32" rx="2" fill="#fff" opacity=".2"/>
        <rect x="32" y="44" width="26" height="50" rx="2" fill="#fff" opacity=".3"/>
        <rect x="62" y="58" width="20" height="36" rx="2" fill="#fff" opacity=".2"/>
        <rect x="60" y="6" width="48" height="62" rx="5" fill="#fff"/>
        <circle cx="84" cy="50" r="10" fill="#F2DFA0"/>
        <path d="M79 50l3.6 3.6 6.4-7" stroke="#241a05" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3>Cek Legalitas Gratis, 1 Menit</h3>
      <p>Jawab 4 pertanyaan singkat. Kami berikan rekomendasi izin wajib yang harus kamu punya.</p>
      <button class="btn" style="background: var(--card); color: var(--pri)" data-go="cek">
        ${S.biz ? "Lihat Hasil Izin Usaha Saya" : "Mulai Cek Izin Sekarang"}
      </button>
    </div>

    <!-- Banner Pintas AI Chatbot -->
    <div class="card row sp" style="background: var(--okbg); border: 1.5px solid var(--ok); margin-top: 14px; cursor: pointer" data-action="open-ai">
      <div class="row">
        <div style="background: var(--pri); color: #fff; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; font-size: 20px">🤖</div>
        <div>
          <h3>Asisten AI Legal & Bisnis</h3>
          <p class="mute">Tanya syarat NIB, Halal, HPP, atau draf kontrak gratis 24 jam</p>
        </div>
      </div>
      <button class="btn sm" style="pointer-events: none">Tanya AI</button>
    </div>
  `;

  // Kesiapan Izin
  if (rules.length) {
    const nextItem = rules.find(r => !S.done || !S.done[r.id]);
    h += `
      <h2>Kesiapan Legalitas Usahamu</h2>
      <div class="card row" data-go="cek" style="cursor: pointer" tabindex="0">
        <div class="ring" style="background: conic-gradient(var(--ok) ${progressPct}%, var(--line) 0)">
          <b>${progressPct}%</b>
        </div>
        <div style="min-width: 0">
          <h3>${completedCount} dari ${rules.length} Izin Siap</h3>
          <p class="mute">${nextItem ? "Berikutnya: " + esc(nextItem.n) : "Semua izin dasar lengkap. Mantap!"}</p>
        </div>
      </div>
    `;
  }

  // Pesanan Paket Aktif
  if (S.order) {
    const pk = PACKAGES.find(p => p.id === S.order.id) || PACKAGES[0];
    const isDone = S.order.s >= pk.m.length;
    h += `
      <h2>Pesanan Layanan Aktif</h2>
      <div class="card" data-go="paket" style="cursor: pointer">
        <div class="row sp">
          <h3>${esc(pk.n)}</h3>
          <span class="tag ${isDone ? "ok" : ""}">${isDone ? "Selesai" : "Diproses Konsultan"}</span>
        </div>
        <p class="mute" style="margin: 4px 0 8px">Tahap ${Math.min(S.order.s + 1, pk.m.length)} dari ${pk.m.length}: <b>${esc(pk.m[Math.min(S.order.s, pk.m.length - 1)])}</b></p>
        <div class="bar"><i style="width: ${(S.order.s / pk.m.length) * 100}%"></i></div>
      </div>
    `;
  }

  // Sesi Konsultasi Mendatang
  const upcomingSessions = (S.sessions || []).filter(s => s.st === "akan");
  if (upcomingSessions.length) {
    const s = upcomingSessions[0];
    h += `
      <div class="row sp" style="margin-top: 10px">
        <h2>Jadwal Konsultasi Terdekat</h2>
        <button class="back" data-go="jdw" style="margin-top: 16px">Lihat Semua</button>
      </div>
      <div class="card row sp" data-go="jdw" style="cursor: pointer">
        <div class="row">
          <div style="background: var(--accbg); color: var(--tg); width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-weight: 800; font-size: 13px">
            ${s.slot || "09.00"}
          </div>
          <div>
            <h3>${esc(s.title)}</h3>
            <p class="mute">${formatDate(s.d)} · ${esc(s.topic || s.fmt || "Chat")}</p>
          </div>
        </div>
        <button class="btn sm" data-room="${(S.sessions || []).indexOf(s)}">Masuk Chat</button>
      </div>
    `;
  }

  // Menu Cepat "Mau Ngapain Hari Ini?"
  h += `
    <h2>Menu Cepat</h2>
    <div class="grid">
      <button class="qa" data-go="cek">
        <span>${renderIcon("M5 13l4 4L19 7")}</span>
        Cek Izin
      </button>
      <button class="qa" data-go="konsul">
        <span>${renderIcon("M4 5h16v11H9l-5 4z")}</span>
        Tanya Ahli
      </button>
      <button class="qa" data-go="kbli">
        <span>${renderIcon("M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z")}</span>
        Cari KBLI
      </button>
    </div>

    <!-- Alat Usaha Tambahan -->
    <h2>Alat Bantu Usaha</h2>
    <div class="grid">
      <button class="qa" data-go="kontrak">
        <span>${renderIcon("M6 2h9l5 5v15H6z")}</span>
        Draf Kontrak
      </button>
      <button class="qa" data-go="pajak">
        <span>${renderIcon("M4 20L20 4M7 7h.01M17 17h.01")}</span>
        Pajak 0,5%
      </button>
      <button class="qa" data-go="halal">
        <span>${renderIcon("M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z")}</span>
        Alur Halal
      </button>
      <button class="qa" data-go="modal">
        <span>${renderIcon("M12 2v20M17 6H9.5a3 3 0 000 6h5a3 3 0 010 6H6")}</span>
        Simulasi KUR
      </button>
      <button class="qa" data-go="diag">
        <span>${renderIcon("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z")}</span>
        Diagnosis
      </button>
      <button class="qa" data-go="dok">
        <span>${renderIcon("M3 6h7l2 2h9v12H3z")}</span>
        Brankas
      </button>
    </div>

    <!-- Kenapa LegalIn -->
    <h2>Keamanan & Garansi LegalIn</h2>
    <div class="trust" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px">
      <div style="background: var(--card); border-radius: 18px; padding: 12px 6px; text-align: center; font-size: 11px; font-weight: 800">
        ${renderIcon("M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z")}
        Konsultan<br>Terverifikasi
      </div>
      <div style="background: var(--card); border-radius: 18px; padding: 12px 6px; text-align: center; font-size: 11px; font-weight: 800">
        ${renderIcon("M6 10V8a6 6 0 1112 0v2M5 10h14v11H5z")}
        Dokumen<br>Terenkripsi
      </div>
      <div style="background: var(--card); border-radius: 18px; padding: 12px 6px; text-align: center; font-size: 11px; font-weight: 800">
        ${renderIcon("M3 12h4l3-8 4 16 3-8h4")}
        Dana Aman<br>Per Tahap
      </div>
    </div>
  `;

  return h;
}

/* ==========================================================================
   VIEW 2: CEK IZIN (WIZARD & HASIL)
   ========================================================================== */
let wizardStep = 0;
let wizardAnswers = {};

function viewCekIzin() {
  // Jika belum ada profil usaha, tampilkan wizard
  if (!S.biz) {
    const q = LEGAL_QUESTIONS[wizardStep];
    let h = `
      <div class="bar" style="margin: 8px 0 18px">
        <i style="width: ${(wizardStep / LEGAL_QUESTIONS.length) * 100}%"></i>
      </div>
      <p class="mute">Pertanyaan ${wizardStep + 1} dari ${LEGAL_QUESTIONS.length}</p>
      <h1 style="margin: 6px 0 16px">${esc(q.q)}</h1>
    `;

    q.o.forEach(opt => {
      h += `
        <button class="opt" data-wz-ans="${esc(opt[0])}" style="font-size: 14px">
          ${esc(opt[1])}
        </button>
      `;
    });

    if (wizardStep > 0) {
      h += `<button class="btn sec" data-wz-back="1" style="margin-top: 10px">← Kembali ke Pertanyaan Sebelumnya</button>`;
    }
    return h;
  }

  // Tampilkan hasil daftar izin
  const rules = generateLegalRules(S.biz);
  const doneCount = rules.filter(r => S.done && S.done[r.id]).length;
  const pct = Math.round((doneCount / rules.length) * 100);

  let h = `
    <button class="back" data-go="home">← Beranda</button>
    <h1>Izin yang Dibutuhkan Usahamu</h1>
    <p class="mute" style="margin: 4px 0 14px">Ketuk kotak centang untuk menandai izin yang sudah beres.</p>

    <div class="card row">
      <div class="ring" style="background: conic-gradient(var(--ok) ${pct}%, var(--line) 0)">
        <b>${pct}%</b>
      </div>
      <div>
        <h3>${doneCount} dari ${rules.length} Izin Selesai</h3>
        <p class="mute">Yang bertanda 'Wajib' sebaiknya diprioritaskan lebih dulu.</p>
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
            <span class="tag ${r.w ? "" : "ok"}">${r.w ? "Wajib" : "Disarankan"}</span>
          </div>
          <p class="mute" style="font-size: 11.5px; margin: 2px 0 4px">Instansi: ${esc(r.agency)}</p>
          <div class="det">${esc(r.d)}</div>
        </div>
      </div>
    `;
  });

  h += `
    <button class="btn" data-go="paket" style="margin-top: 8px">
      Mau Diuruskan Ahli? Lihat Paket Usaha
    </button>
    <button class="btn sec" data-redo-wizard="1" style="margin-top: 8px">
      Ulangi Kuis Cek Izin
    </button>
    <p class="mute" style="font-size: 11.5px; text-align: center; margin-top: 14px">
      *Ketentuan izin mengacu pada regulasi OSS RBA, BPJPH, Dinkes, dan DJKI terkini.
    </p>
  `;

  return h;
}

/* ==========================================================================
   VIEW 3: PENCARI KBLI OSS (KBLI FINDER)
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
        <div class="card" style="background: var(--bg); margin: 0; padding: 10px 12px">
          <p style="font-size: 12px; margin: 0"><b>Izin wajib yang diterbitkan:</b> ${esc(k.req)}</p>
        </div>
      </div>
    `;
  });

  return h;
}

/* ==========================================================================
   VIEW 4: DRAF KONTRAK RESMI & CETAK
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
   VIEW 5: KATALOG KONSULTAN & BOOKING
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
    <h1>Konsultasi dengan Ahli Berpengalaman</h1>
    <p class="mute" style="margin: 4px 0 12px">Ngobrol 45 menit via chat langsung dengan praktisi hukum dan bisnis terverifikasi.</p>

    <!-- Banner AI Chatbot -->
    <div class="card row sp" style="background: var(--accbg); border: 1.5px solid var(--acc); margin-bottom: 14px; cursor: pointer" data-action="open-ai">
      <div>
        <h3>Ingin Jawaban Instan & Gratis?</h3>
        <p class="mute">Gunakan Asisten AI LegalIn untuk pertanyaan regulasi dan izin awal.</p>
      </div>
      <button class="btn sm" style="pointer-events: none">Tanya AI</button>
    </div>

    <!-- Tab Pilihan Tipe -->
    <div class="seg">
      <button class="${consultantType === "h" ? "on" : ""}" data-konsul-type="h">Konsultan Hukum (${CONSULTANTS.filter(c => c.type === "h").length})</button>
      <button class="${consultantType === "b" ? "on" : ""}" data-konsul-type="b">Konsultan Bisnis (${CONSULTANTS.filter(c => c.type === "b").length})</button>
    </div>

    <div class="chips">
  `;

  cities.forEach(ct => {
    h += `<button class="chip ${ct === consultantCity ? "on" : ""}" data-konsul-city="${ct}">${ct}</button>`;
  });

  h += `</div>`;

  list.forEach(c => {
    const idx = CONSULTANTS.indexOf(c);
    h += `
      <div class="card">
        <div class="row" style="align-items: flex-start">
          <div style="background: var(--accbg); color: var(--tg); width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-weight: 800; font-size: 16px; flex: none">
            ${c.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
          </div>
          <div style="min-width: 0; flex: 1">
            <div class="row sp">
              <h3>${esc(c.name)}</h3>
              <span class="tag ok">⭐ ${c.rating} (${c.reviewsCount})</span>
            </div>
            <p class="mute" style="font-size: 12px; margin: 2px 0 4px">${esc(c.title)} · <b>${esc(c.city)}</b></p>
            <p style="font-size: 13px; line-height: 1.4">${esc(c.bio)}</p>
          </div>
        </div>

        <div class="row sp" style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--line)">
          <div>
            <span class="mute" style="font-size: 11px">Tarif 45 Menit:</span><br>
            <span class="price">${formatRp(c.rate)}</span>
          </div>
          <button class="btn sm" data-start-booking="${idx}">Pilih Jadwal Sesi</button>
        </div>
      </div>
    `;
  });

  return h;
}

/* ==========================================================================
   VIEW 6: ALUR BOOKING SESI
   ========================================================================== */
function viewBooking() {
  if (!activeBooking) return viewKonsultan();
  const c = CONSULTANTS[activeBooking.i];
  const daysList = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    daysList.push(d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }));
  }
  const slots = ["09.00", "11.00", "14.00", "16.00"];

  return `
    <button class="back" data-go="konsul">← Kembali ke Daftar Konsultan</button>
    <h1>Jadwalkan Sesi Konsultasi</h1>

    <div class="card row">
      <div style="background: var(--accbg); color: var(--tg); width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-weight: 800">
        ${c.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
      </div>
      <div>
        <h3>${esc(c.name)}</h3>
        <p class="mute">${esc(c.spec)} · ${esc(c.city)}</p>
      </div>
    </div>

    <h2>1. Pilih Topik Konsultasi</h2>
    <div class="chips" style="flex-wrap: wrap">
      ${c.topics.map((t, idx) => `
        <button class="chip ${activeBooking.topicIdx === idx ? "on" : ""}" data-book-topic="${idx}">${t}</button>
      `).join("")}
    </div>

    <h2>2. Pilih Tanggal</h2>
    <div class="chips" style="flex-wrap: wrap">
      ${daysList.map((d, idx) => `
        <button class="chip ${activeBooking.dayIdx === idx ? "on" : ""}" data-book-day="${idx}">${d}</button>
      `).join("")}
    </div>

    <h2>3. Pilih Jam</h2>
    <div class="chips">
      ${slots.map((s, idx) => `
        <button class="chip ${activeBooking.slotIdx === idx ? "on" : ""}" data-book-slot="${idx}">${s} WIB</button>
      `).join("")}
    </div>

    <div class="card row sp" style="margin-top: 14px">
      <span class="mute">Total Biaya Sesi Chat</span>
      <span class="price">${formatRp(c.rate)}</span>
    </div>

    <button class="btn" data-action="confirm-booking-pay">
      Lanjut ke Pembayaran Escrow
    </button>
  `;
}

/* ==========================================================================
   VIEW 7: RUANG CHAT KONSULTAN & NOTULENSI
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
      <button class="back" data-go="jdw" style="margin: 0">← Jadwal</button>
      <span class="tag ${isCompleted ? "ok" : ""}">${isCompleted ? "Selesai" : "Sesi Berlangsung"}</span>
    </div>

    <div class="card row sp">
      <div>
        <h3>${esc(session.title)}</h3>
        <p class="mute">${esc(session.topic || "Konsultasi")} · Slot: ${esc(session.slot || "09.00")} WIB</p>
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
      <div class="card" style="padding: 10px">
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
    // Sesi Selesai: Tampilkan Notulensi Resmi
    h += `
      <div class="card" style="background: var(--okbg); border: 1.5px solid var(--ok)">
        <h3>📄 Notulensi Resmi Sesi Telah Terbit</h3>
        <p class="mute" style="margin: 4px 0 10px">Rangkuman hasil konsultasi, temuan hukum, dan langkah tindak lanjut telah diverifikasi.</p>
        <div class="row">
          <button class="btn sm" data-action="view-session-note">Buka & Cetak Notulensi</button>
          <button class="btn sm sec" data-action="save-note-vault">Simpan ke Brankas</button>
        </div>
      </div>
    `;
  }

  return h;
}

/* ==========================================================================
   VIEW 8: BRANKAS DOKUMEN & PENGINGAT
   ========================================================================== */
function viewDokumen() {
  let h = `
    <h1>Brankas & Pengingat Izin</h1>
    <p class="mute" style="margin: 4px 0 12px">Simpan KTP, NPWP, NIB, dan sertifikat usahamu di satu tempat aman.</p>

    <div class="seg">
      <button class="${vaultSubTab === "b" ? "on" : ""}" data-vault-tab="b">Brankas Dokumen (${(S.docs || []).length})</button>
      <button class="${vaultSubTab === "p" ? "on" : ""}" data-vault-tab="p">Pengingat Masa Berlaku (${(S.rem || []).length})</button>
    </div>
  `;

  if (vaultSubTab === "b") {
    // Sub-tab: Brankas
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
          else if (diff <= 30) tag = `<span class="tag">Habis dalam ${diff} hari</span>`;
          else tag = `<span class="tag ok">Berlaku s.d. ${formatDate(d.exp)}</span>`;
        }

        h += `
          <div class="card">
            <div class="row sp">
              <div class="row" style="min-width: 0">
                <div style="background: var(--accbg); color: var(--tg); width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-weight: 800; font-size: 14px; flex: none">
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
    // Sub-tab: Pengingat & WhatsApp Bot
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

      <!-- Simulasi Notifikasi WhatsApp -->
      <h2>Simulasi Bot WhatsApp LegalIn</h2>
      <div class="card" style="background: #EBF5EA; border: 1.5px solid #63B272">
        <div class="row" style="margin-bottom: 8px">
          <span style="font-size: 20px">💬</span>
          <div>
            <b>WhatsApp Business API (Simulasi)</b>
            <p class="mute" style="font-size: 11px">Pesan otomatis terkirim ke: ${esc(S.user ? S.user.phone : "0812-3456-7890")}</p>
          </div>
        </div>
        <div class="card" style="background: #FFFFFF; padding: 10px 14px; margin: 0">
          <p style="font-size: 13px; line-height: 1.45; margin: 0">
            "Halo <b>${esc(S.user ? S.user.biz : "Pelaku UMKM")}</b>! Kami mengingatkan bahwa izin <b>SPP-PIRT Dinas Kesehatan</b> usahamu akan habis dalam <b>${daysDiff("2026-11-20")} hari</b>. Balas <b>URUS</b> untuk kami hubungkan ke konsultan daerahmu."
          </p>
        </div>
        <div class="row" style="margin-top: 10px">
          <button class="btn sm" data-action="simulate-wa-reply">Kirim Uji WhatsApp</button>
        </div>
      </div>
    `;
  }

  return h;
}

/* ==========================================================================
   VIEW 9: PROFIL USAHA & PENGATURAN
   ========================================================================== */
function viewProfil() {
  const u = S.user || {};

  return `
    <button class="back" data-go="home">← Beranda</button>
    <h1>Profil Usaha & Pengaturan</h1>

    <div class="card">
      <h3>Informasi Bisnis</h3>
      <label class="lb" for="p-biz">Nama Usaha / Merek</label>
      <input id="p-biz" class="inp" type="text" value="${esc(u.biz || "")}" data-action="p-biz-inp">

      <label class="lb" for="p-owner">Nama Pemilik Usaha</label>
      <input id="p-owner" class="inp" type="text" value="${esc(u.owner || "")}" data-action="p-owner-inp">

      <label class="lb" for="p-phone">Nomor Kontak WhatsApp</label>
      <input id="p-phone" class="inp" type="text" value="${esc(u.phone || "")}" data-action="p-phone-inp">

      <label class="lb" for="p-city">Kota Domisili Usaha</label>
      <input id="p-city" class="inp" type="text" value="${esc(u.city || "Solo")}" data-action="p-city-inp">

      <button class="btn" data-action="save-profile" style="margin-top: 8px">Simpan Profil Usaha</button>
    </div>

    <!-- Integrasi Gemini API -->
    <h2>Pengaturan AI Chatbot (Opsional)</h2>
    <div class="card">
      <p class="mute" style="margin-bottom: 8px">
        Secara default, Asisten AI LegalIn menggunakan mesin penalaran cerdas offline. Masukkan Gemini API Key jika Anda ingin respons AI langsung tanpa batas.
      </p>
      <label class="lb" for="api-key-inp">Google Gemini API Key:</label>
      <input id="api-key-inp" class="inp" type="password" placeholder="AIzaSy..." value="${esc(S.apiKey || "")}" data-action="api-key-inp">
      <button class="btn sm sec" data-action="save-api-key">Simpan API Key</button>
    </div>

    <!-- Kontrol Reset Data Demo -->
    <h2>Kelola Data Prototipe</h2>
    <div class="card">
      <p class="mute" style="margin-bottom: 12px">Gunakan tombol di bawah untuk kebutuhan demonstrasi atau presentasi.</p>
      <div class="row">
        <button class="btn sm" data-action="reset-to-demo">Muat Ulang Data Demo</button>
        <button class="btn sm sec" data-action="reset-to-blank">Reset ke Data Kosong</button>
      </div>
    </div>
  `;
}

/* ==========================================================================
   VIEW 10: NOTULENSI RESMI CETAK (A4 VIEW)
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
    room: viewConsultantRoom,
    dok: viewDokumen,
    prof: viewProfil,
    notes: viewNotes,
    // Modul tambahan
    jdw: () => {
      let h = `
        <button class="back" data-go="home">← Beranda</button>
        <h1>Jadwal Konsultasi Saya</h1>
        <p class="mute" style="margin: 4px 0 12px">Daftar sesi konsultasi aktif dan riwayat notulensi Anda.</p>
      `;
      if (!S.sessions || !S.sessions.length) {
        h += `<div class="card"><p class="mute">Belum ada sesi konsultasi. Jadwalkan sesi di menu Konsultan.</p></div>`;
      } else {
        S.sessions.forEach((s, idx) => {
          const isDone = s.st === "selesai";
          h += `
            <div class="card">
              <div class="row sp">
                <div>
                  <h3>${esc(s.title)}</h3>
                  <p class="mute">${formatDate(s.d)} · Slot: ${esc(s.slot || "09.00")} WIB · ${esc(s.topic || "Konsultasi")}</p>
                </div>
                <span class="tag ${isDone ? "ok" : ""}">${isDone ? "Selesai" : "Akan Datang"}</span>
              </div>
              <div class="row sp" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--line)">
                <span class="price">${formatRp(s.pr)}</span>
                <button class="btn sm" data-room="${idx}">
                  ${isDone ? "Lihat Notulensi" : "Buka Ruang Chat"}
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
        <h1>Paket Urus Izin Resmi</h1>
        <p class="mute" style="margin: 4px 0 12px">Pengurusan izin terpadu dengan perlindungan sistem pembayaran escrow bergaransi.</p>
      `;
      PACKAGES.forEach(pk => {
        h += `
          <div class="card">
            <div class="row sp">
              <span class="price" style="font-size: 19px">${formatRp(pk.p)}</span>
              <span class="tag ok">Estimasi ${esc(pk.dur)}</span>
            </div>
            <h3 style="margin-top: 6px">${esc(pk.n)}</h3>
            <p class="mute" style="margin: 2px 0 6px">Penyedia: ${esc(pk.provider)}</p>
            <p style="font-size: 13px; line-height: 1.45">${esc(pk.t)}</p>
            <div class="card" style="background: var(--bg); margin: 8px 0; padding: 10px 12px">
              <p style="font-size: 12px; margin: 0"><b>Tahapan Pengerjaan:</b> ${pk.m.join(" → ")}</p>
            </div>
            <button class="btn sm" data-buy-package="${pk.id}">Pilih Paket Ini</button>
          </div>
        `;
      });
      return h;
    },
    pajak: () => {
      const omzet = 600000000; // Demo Rp 600 Juta
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
          <div class="rc"><span>PPh Final 0,5% Terutang</span><b class="price">${formatRp(taxDue)} / tahun</b></div>
        </div>
        <p class="mute" style="font-size: 12px">Penyetoran dilakukan setiap bulan paling lambat tanggal 15.</p>
      `;
    },
    halal: () => {
      return `
        <button class="back" data-go="home">← Beranda</button>
        <h1>Alur Sertifikasi Halal BPJPH</h1>
        <p class="mute" style="margin: 4px 0 12px">Panduan proses sertifikasi halal jalur Self-Declare & Reguler.</p>
        <div class="card">
          <h3>Jalur Self-Declare (Gratis untuk UMK)</h3>
          <p class="mute" style="margin: 4px 0 8px">Syarat: Bahan baku sudah bersertifikat halal, proses sederhana, didampingi Pendamping PPH.</p>
          <div class="rc"><span>1. Memiliki NIB OSS</span><b>Selesai ✓</b></div>
          <div class="rc"><span>2. Buat Akun di ptsp.halal.go.id</span><b>Langkah 2</b></div>
          <div class="rc"><span>3. Verifikasi Bahan Baku</span><b>Langkah 3</b></div>
          <div class="rc"><span>4. Sidang Fatwa MUI & Terbit Sertifikat</span><b>Langkah 4</b></div>
        </div>
      `;
    },
    modal: () => {
      return `
        <button class="back" data-go="home">← Beranda</button>
        <h1>Simulasi Modal & KUR Mikro</h1>
        <p class="mute" style="margin: 4px 0 12px">Ketahui batas plafon dan persiapan pengajuan kredit bank.</p>
        <div class="card">
          <h3>Kesiapan Syarat Pengajuan:</h3>
          <div class="rc"><span>NIB OSS Resmi</span><b>Tersedia ✓</b></div>
          <div class="rc"><span>NPWP Usaha</span><b>Tersedia ✓</b></div>
          <div class="rc"><span>Usaha Berjalan min. 6 Bulan</span><b>Memenuhi ✓</b></div>
          <div class="rc"><span>Rekening Khusus Usaha</span><b>Tersedia ✓</b></div>
        </div>
        <div class="card" style="background: var(--okbg)">
          <h3>Rekomendasi Jalur: KUR Mikro (s.d. Rp 100 Juta)</h3>
          <p class="mute">Bunga subsidi 6% efektif per tahun tanpa agunan tambahan pokok.</p>
        </div>
      `;
    },
    diag: () => {
      const d = S.diag || { s: 72, areas: { Pemasaran: 80, Keuangan: 65, Operasional: 70, Legalitas: 75 } };
      return `
        <button class="back" data-go="home">← Beranda</button>
        <h1>Diagnosis Kesehatan Bisnis</h1>
        <div class="card row" style="margin-top: 10px">
          <div class="ring" style="background: conic-gradient(var(--ok) ${d.s}%, var(--line) 0)">
            <b>${d.s}</b>
          </div>
          <div>
            <h3>Status: Sehat & Siap Tumbuh</h3>
            <p class="mute">Skor kesehatan usaha secara menyeluruh dari 100.</p>
          </div>
        </div>
        <div class="card">
          <h3>Rincian Skor Per Bidang:</h3>
          <div class="rc"><span>Pemasaran & Penjualan</span><b>${d.areas.Pemasaran}%</b></div>
          <div class="rc"><span>Kerapian Keuangan & HPP</span><b>${d.areas.Keuangan}%</b></div>
          <div class="rc"><span>SOP & Operasional</span><b>${d.areas.Operasional}%</b></div>
          <div class="rc"><span>Kepatuhan Legalitas</span><b>${d.areas.Legalitas}%</b></div>
        </div>
      `;
    }
  };

  const renderFunc = viewMap[currentTab] || viewHome;
  const content = renderFunc();

  $("#app-content").innerHTML = content;

  // Update Navigasi Aktif
  const navItems = [
    { id: "home", label: "Beranda", icon: "M3 11l9-8 9 8v10H3z" },
    { id: "cek", label: "Cek Izin", icon: "M5 13l4 4L19 7" },
    { id: "kbli", label: "KBLI", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
    { id: "konsul", label: "Konsultan", icon: "M4 5h16v11H9l-5 4z" },
    { id: "dok", label: "Brankas", icon: "M3 6h7l2 2h9v12H3z" }
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
    // Konversi markdown sederhana
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

    // Cek Izin: Kembali
    if (e.target.closest("[data-wz-back]")) {
      if (wizardStep > 0) wizardStep--;
      renderApp();
      return;
    }

    // Cek Izin: Toggle Checklist
    const chkEl = e.target.closest("[data-toggle-rule]");
    if (chkEl) {
      const id = chkEl.dataset.toggleRule;
      S.done = S.done || {};
      S.done[id] = !S.done[id];
      saveState();
      renderApp();
      return;
    }

    // Cek Izin: Ulangi Kuis
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
    const startBookEl = e.target.closest("[data-start-booking]");
    if (startBookEl) {
      activeBooking = {
        i: Number(startBookEl.dataset.startBooking),
        topicIdx: 0,
        dayIdx: 0,
        slotIdx: 0
      };
      navigateTo("book");
      return;
    }

    // Booking: Opsi
    const bookTopicEl = e.target.closest("[data-book-topic]");
    if (bookTopicEl) {
      activeBooking.topicIdx = Number(bookTopicEl.dataset.bookTopic);
      renderApp();
      return;
    }
    const bookDayEl = e.target.closest("[data-book-day]");
    if (bookDayEl) {
      activeBooking.dayIdx = Number(bookDayEl.dataset.bookDay);
      renderApp();
      return;
    }
    const bookSlotEl = e.target.closest("[data-book-slot]");
    if (bookSlotEl) {
      activeBooking.slotIdx = Number(bookSlotEl.dataset.bookSlot);
      renderApp();
      return;
    }
    if (e.target.closest("[data-action='confirm-booking-pay']")) {
      const c = CONSULTANTS[activeBooking.i];
      const slot = ["09.00", "11.00", "14.00", "16.00"][activeBooking.slotIdx];
      const topic = c.topics[activeBooking.topicIdx];

      // Masukkan sesi baru
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + activeBooking.dayIdx + 1);

      const newSes = {
        id: "SES-" + Date.now().toString().slice(-6),
        title: "Sesi dengan " + c.name,
        who: c.name,
        topic: topic,
        d: targetDate.toISOString().split("T")[0],
        slot: slot,
        fmt: "Chat",
        st: "akan",
        pr: c.rate,
        trx: "LGI-" + Math.floor(100000 + Math.random() * 900000),
        i: activeBooking.i,
        msgs: [
          ["k", window.LegalInConsultant.getConsultantReply({ topic: topic, msgs: [] })]
        ]
      };

      S.sessions = S.sessions || [];
      S.sessions.unshift(newSes);
      saveState();

      activeConsultationIndex = 0;
      navigateTo("room");
      showToast("Jadwal sesi berhasil dipesan & dana ditahan di escrow!");
      return;
    }

    // 9. Ruang Chat Konsultan
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

      // Respons konsultan terpandu
      setTimeout(() => {
        const reply = window.LegalInConsultant.getConsultantReply(ses);
        ses.msgs.push(["k", reply]);
        saveState();
        renderApp();
      }, 750);
      return;
    }
    if (e.target.closest("[data-action='end-session']")) {
      const ses = S.sessions[activeConsultationIndex];
      ses.st = "selesai";
      saveState();
      renderApp();
      showToast("Sesi selesai! Lembar notulensi resmi diterbitkan.");
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

    // 10. Brankas & Dokumen
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
      showToast("Dokumen berhasil disimpan di Brankas!");
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
      showToast("Pratinjau berkas digital (Simulasi PDF/Gambar).");
      return;
    }
    if (e.target.closest("[data-action='simulate-wa-reply']")) {
      showToast("Pesan WhatsApp pengingat uji berhasil dikirim ke nomor Anda!");
      return;
    }

    // 11. Profil & Reset
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
      showToast("Profil usaha berhasil disimpan!");
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
    const buyPkgEl = e.target.closest("[data-buy-package]");
    if (buyPkgEl) {
      S.order = { id: buyPkgEl.dataset.buyPackage, s: 0 };
      saveState();
      navigateTo("home");
      showToast("Paket berhasil dipesan via Escrow!");
      return;
    }
  });

  // Event Input Global (KBLI, Draf Kontrak, Profil)
  document.addEventListener("input", (e) => {
    if (e.target.dataset.action === "search-kbli") {
      kbliSearchTerm = e.target.value;
      renderApp();
      // Jaga fokus input tetap aktif
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

const HANDLING_KEY = "bullyingcare_case_handlings";
const REPORT_KEY = "sahabat_reports_demo_v1";
const USER_KEY = "bullyingcare_admin_users";
const LABELS = { belum_ditangani: "Belum ditangani", sedang_ditangani: "Sedang ditangani", selesai: "Selesai" };
const table = document.getElementById("handlingTable");
const modal = document.getElementById("handlingModal");
const form = document.getElementById("handlingForm");
let handlings = readArray(HANDLING_KEY, "penanganan kasus");
let reports = readArray(REPORT_KEY, "laporan");
let users = readArray(USER_KEY, "pengguna");

function readArray(key, label) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(value)) throw new Error(`Format data ${label} tidak valid.`);
        return value;
    } catch (error) {
        alert(`Data ${label} gagal dibaca: ${error.message}`);
        return [];
    }
}
function save() {
    try { localStorage.setItem(HANDLING_KEY, JSON.stringify(handlings)); return true; }
    catch { return false; }
}
function code(report) { return report.reportCode || report.code || `LPR-${report.id}`; }
function reportTitle(report) { return `${code(report)} — ${report.title || report.description?.slice(0, 45) || "Laporan"}`; }
function formatDate(value) {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
function cell(text) { const td = document.createElement("td"); td.textContent = text; return td; }
function statusBadge(status) {
    const badge = document.createElement("span");
    badge.className = `local-data-badge ${status}`;
    badge.textContent = LABELS[status] || status;
    return badge;
}
function actionButton(label, action, id, destructive = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `local-data-action${destructive ? " delete" : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = String(id);
    return button;
}
function render() {
    const search = document.getElementById("handlingSearch").value.trim().toLocaleLowerCase("id");
    const status = document.getElementById("handlingFilter").value;
    const filtered = handlings.filter(item => {
        const report = reports.find(row => String(row.id) === String(item.reportId));
        const counselor = users.find(row => String(row.id) === String(item.counselorId));
        return `${report ? reportTitle(report) : item.reportCode || ""} ${counselor?.name || ""}`.toLocaleLowerCase("id").includes(search) &&
            (!status || item.handlingStatus === status);
    });
    table.replaceChildren();
    document.getElementById("handlingCount").textContent = `${handlings.length} penanganan`;
    document.getElementById("handlingSummary").textContent = `Menampilkan ${filtered.length} dari ${handlings.length} penanganan`;
    if (!filtered.length) {
        const row = document.createElement("tr"); const td = cell("Belum ada data penanganan."); td.colSpan = 5; td.className = "local-data-empty"; row.append(td); table.append(row);
    }
    filtered.forEach(item => {
        const report = reports.find(row => String(row.id) === String(item.reportId));
        const counselor = users.find(row => String(row.id) === String(item.counselorId));
        const row = document.createElement("tr");
        row.append(cell(report ? reportTitle(report) : item.reportCode || "Laporan tidak ditemukan"));
        row.append(cell(counselor?.name || "Konselor tidak ditemukan"));
        row.append(cell(formatDate(item.handlingDate)));
        const statusCell = document.createElement("td"); statusCell.append(statusBadge(item.handlingStatus)); row.append(statusCell);
        const actions = document.createElement("td"); const group = document.createElement("div"); group.className = "local-data-actions";
        group.append(actionButton("Ubah", "edit", item.id), actionButton("Hapus", "delete", item.id, true)); actions.append(group); row.append(actions); table.append(row);
    });
}
function fillSelect(select, options, placeholder, selected = "") {
    select.replaceChildren();
    const blank = document.createElement("option"); blank.value = ""; blank.textContent = placeholder; select.append(blank);
    options.forEach(item => { const option = document.createElement("option"); option.value = String(item.id); option.textContent = item.label; select.append(option); });
    select.value = String(selected || "");
}
function open(item = null) {
    form.reset(); document.getElementById("handlingError").hidden = true;
    const reportsForSelect = reports.map(report => ({ id: report.id, label: reportTitle(report) }));
    const counselors = users.filter(user => user.role === "guru_bk").map(user => ({ id: user.id, label: `${user.name} (${user.email})` }));
    fillSelect(document.getElementById("handlingReport"), reportsForSelect, "Pilih laporan", item?.reportId);
    fillSelect(document.getElementById("handlingCounselor"), counselors, "Pilih Guru BK", item?.counselorId);
    document.getElementById("handlingId").value = item ? String(item.id) : "";
    document.getElementById("handlingModalTitle").textContent = item ? "Ubah Penanganan" : "Tambah Penanganan";
    document.getElementById("handlingDate").value = item?.handlingDate || "";
    document.getElementById("handlingStatus").value = item?.handlingStatus || "belum_ditangani";
    document.getElementById("actionTaken").value = item?.actionTaken || "";
    document.getElementById("followUp").value = item?.followUp || "";
    if (!reports.length || !counselors.length) {
        document.getElementById("handlingError").textContent = !reports.length
            ? "Tambahkan laporan terlebih dahulu."
            : "Tambahkan pengguna dengan role Guru BK terlebih dahulu.";
        document.getElementById("handlingError").hidden = false;
    }
    modal.hidden = false;
}
function close() { modal.hidden = true; form.reset(); }
document.getElementById("addHandling").addEventListener("click", () => open());
document.getElementById("closeHandling").addEventListener("click", close);
document.getElementById("cancelHandling").addEventListener("click", close);
document.getElementById("handlingSearch").addEventListener("input", render);
document.getElementById("handlingFilter").addEventListener("change", render);
document.getElementById("resetHandlingFilters").addEventListener("click", () => {
    document.getElementById("handlingSearch").value = ""; document.getElementById("handlingFilter").value = ""; render();
});
modal.addEventListener("click", event => { if (event.target === modal) close(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) close(); });
table.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]"); if (!button) return;
    const item = handlings.find(row => String(row.id) === button.dataset.id); if (!item) return;
    if (button.dataset.action === "edit") { open(item); return; }
    if (!confirm("Hapus data penanganan ini?")) return;
    const previous = handlings; handlings = handlings.filter(row => row.id !== item.id);
    if (save()) render(); else { handlings = previous; alert("Data gagal dihapus dari localStorage."); }
});
form.addEventListener("submit", event => {
    event.preventDefault();
    const id = document.getElementById("handlingId").value;
    const existing = handlings.find(item => String(item.id) === id);
    const reportId = document.getElementById("handlingReport").value;
    const counselorId = document.getElementById("handlingCounselor").value;
    const report = reports.find(item => String(item.id) === reportId);
    const counselor = users.find(item => String(item.id) === counselorId && item.role === "guru_bk");
    const error = document.getElementById("handlingError");
    if (!report || !counselor) {
        error.textContent = !report ? "Pilih laporan yang valid." : "Pilih pengguna dengan role Guru BK.";
        error.hidden = false; return;
    }
    if (handlings.some(item => String(item.reportId) === String(report.id) && item.id !== existing?.id)) {
        error.textContent = "Laporan ini sudah memiliki data penanganan.";
        error.hidden = false; return;
    }
    const now = new Date().toISOString();
    const item = {
        ...(existing || {}),
        id: existing?.id || handlings.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1,
        reportId: report.id,
        reportCode: code(report),
        counselorId: counselor.id,
        handlingDate: document.getElementById("handlingDate").value || null,
        actionTaken: document.getElementById("actionTaken").value.trim(),
        followUp: document.getElementById("followUp").value.trim(),
        handlingStatus: document.getElementById("handlingStatus").value,
        createdAt: existing?.createdAt || now,
        updatedAt: now
    };
    const previous = handlings;
    handlings = existing ? handlings.map(row => row.id === existing.id ? item : row) : [...handlings, item];
    if (save()) { close(); render(); } else { handlings = previous; error.textContent = "Data gagal disimpan ke localStorage."; error.hidden = false; }
});
render();

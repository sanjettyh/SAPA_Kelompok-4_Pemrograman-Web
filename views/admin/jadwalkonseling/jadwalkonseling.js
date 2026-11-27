const SESSION_KEY = "bullyingcare_counseling_sessions";
const HANDLING_KEY = "bullyingcare_case_handlings";
const USER_KEY = "bullyingcare_admin_users";
const STATUS_LABELS = { dijadwalkan: "Dijadwalkan", selesai: "Selesai", dibatalkan: "Dibatalkan" };
const table = document.getElementById("sessionTable");
const modal = document.getElementById("sessionModal");
const form = document.getElementById("sessionForm");
let sessions = readArray(SESSION_KEY, "sesi konseling");
let handlings = readArray(HANDLING_KEY, "penanganan kasus");
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
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sessions)); return true; }
    catch { return false; }
}
function localDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
}
function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function appendSelectOptions(select, list, placeholder, selected = "") {
    select.replaceChildren();
    const first = document.createElement("option"); first.value = ""; first.textContent = placeholder; select.append(first);
    list.forEach(item => { const option = document.createElement("option"); option.value = String(item.id); option.textContent = item.label; select.append(option); });
    select.value = String(selected || "");
}
function cell(value) { const td = document.createElement("td"); td.textContent = value; return td; }
function button(label, action, id, destructive = false) {
    const element = document.createElement("button"); element.type = "button";
    element.className = `local-data-action${destructive ? " delete" : ""}`;
    element.textContent = label; element.dataset.action = action; element.dataset.id = String(id); return element;
}
function render() {
    const search = document.getElementById("sessionSearch").value.trim().toLocaleLowerCase("id");
    const status = document.getElementById("sessionFilter").value;
    const filtered = sessions.filter(session => {
        const student = users.find(user => String(user.id) === String(session.studentId));
        const counselor = users.find(user => String(user.id) === String(session.counselorId));
        return `${student?.name || ""} ${counselor?.name || ""}`.toLocaleLowerCase("id").includes(search) &&
            (!status || session.sessionStatus === status);
    });
    table.replaceChildren();
    document.getElementById("sessionCount").textContent = `${sessions.length} sesi`;
    document.getElementById("sessionSummary").textContent = `Menampilkan ${filtered.length} dari ${sessions.length} sesi`;
    if (!filtered.length) { const row = document.createElement("tr"); const td = cell("Belum ada sesi konseling."); td.colSpan = 6; td.className = "local-data-empty"; row.append(td); table.append(row); }
    filtered.sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate)).forEach(session => {
        const student = users.find(user => String(user.id) === String(session.studentId));
        const counselor = users.find(user => String(user.id) === String(session.counselorId));
        const row = document.createElement("tr");
        row.append(cell(student?.name || "Tidak ditentukan"), cell(counselor?.name || "Konselor tidak ditemukan"), cell(formatDateTime(session.sessionDate)), cell(session.sessionType === "online" ? "Online" : "Tatap muka"));
        const statusCell = document.createElement("td"); const badge = document.createElement("span"); badge.className = `local-data-badge ${session.sessionStatus}`; badge.textContent = STATUS_LABELS[session.sessionStatus] || session.sessionStatus; statusCell.append(badge); row.append(statusCell);
        const actionCell = document.createElement("td"); const actions = document.createElement("div"); actions.className = "local-data-actions"; actions.append(button("Ubah", "edit", session.id), button("Hapus", "delete", session.id, true)); actionCell.append(actions); row.append(actionCell); table.append(row);
    });
}
function open(session = null) {
    form.reset(); document.getElementById("sessionError").hidden = true;
    appendSelectOptions(document.getElementById("sessionHandling"), handlings.map(item => ({ id: item.id, label: item.reportCode || `Laporan ${item.reportId}` })), "Pilih penanganan", session?.handlingId);
    appendSelectOptions(document.getElementById("sessionStudent"), users.filter(user => user.role === "siswa").map(user => ({ id: user.id, label: `${user.name} (${user.email})` })), "Tidak ditentukan", session?.studentId);
    appendSelectOptions(document.getElementById("sessionCounselor"), users.filter(user => user.role === "guru_bk").map(user => ({ id: user.id, label: `${user.name} (${user.email})` })), "Pilih Guru BK", session?.counselorId);
    document.getElementById("sessionId").value = session ? String(session.id) : "";
    document.getElementById("sessionModalTitle").textContent = session ? "Ubah Sesi" : "Jadwalkan Sesi";
    document.getElementById("sessionDate").value = localDateTime(session?.sessionDate);
    document.getElementById("sessionType").value = session?.sessionType || "tatap_muka";
    document.getElementById("sessionStatus").value = session?.sessionStatus || "dijadwalkan";
    document.getElementById("sessionNotes").value = session?.notes || "";
    if (!handlings.length || !users.some(user => user.role === "guru_bk")) {
        const error = document.getElementById("sessionError"); error.textContent = !handlings.length ? "Tambahkan penanganan kasus terlebih dahulu." : "Tambahkan pengguna dengan role Guru BK terlebih dahulu."; error.hidden = false;
    }
    modal.hidden = false;
}
function close() { modal.hidden = true; form.reset(); }
document.getElementById("addSession").addEventListener("click", () => open());
document.getElementById("closeSession").addEventListener("click", close);
document.getElementById("cancelSession").addEventListener("click", close);
document.getElementById("sessionSearch").addEventListener("input", render);
document.getElementById("sessionFilter").addEventListener("change", render);
document.getElementById("resetSessionFilters").addEventListener("click", () => { document.getElementById("sessionSearch").value = ""; document.getElementById("sessionFilter").value = ""; render(); });
modal.addEventListener("click", event => { if (event.target === modal) close(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) close(); });
table.addEventListener("click", event => {
    const action = event.target.closest("button[data-action]"); if (!action) return;
    const session = sessions.find(item => String(item.id) === action.dataset.id); if (!session) return;
    if (action.dataset.action === "edit") { open(session); return; }
    if (!confirm("Hapus jadwal konseling ini?")) return;
    const previous = sessions; sessions = sessions.filter(item => item.id !== session.id);
    if (save()) render(); else { sessions = previous; alert("Jadwal gagal dihapus dari localStorage."); }
});
form.addEventListener("submit", event => {
    event.preventDefault();
    const error = document.getElementById("sessionError"); error.hidden = true;
    const id = document.getElementById("sessionId").value;
    const existing = sessions.find(item => String(item.id) === id);
    const handlingId = document.getElementById("sessionHandling").value;
    const counselorId = document.getElementById("sessionCounselor").value;
    const handling = handlings.find(item => String(item.id) === handlingId);
    const counselor = users.find(user => String(user.id) === counselorId && user.role === "guru_bk");
    if (!handling || !counselor) { error.textContent = !handling ? "Pilih penanganan kasus yang valid." : "Pilih konselor dengan role Guru BK."; error.hidden = false; return; }
    const now = new Date().toISOString();
    const session = {
        ...(existing || {}),
        id: existing?.id || sessions.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
        handlingId: handling.id,
        studentId: document.getElementById("sessionStudent").value || null,
        counselorId: counselor.id,
        sessionDate: new Date(document.getElementById("sessionDate").value).toISOString(),
        sessionType: document.getElementById("sessionType").value,
        sessionStatus: document.getElementById("sessionStatus").value,
        notes: document.getElementById("sessionNotes").value.trim(),
        createdAt: existing?.createdAt || now,
        updatedAt: now
    };
    const previous = sessions; sessions = existing ? sessions.map(item => item.id === existing.id ? session : item) : [...sessions, session];
    if (save()) { close(); render(); } else { sessions = previous; error.textContent = "Jadwal gagal disimpan ke localStorage."; error.hidden = false; }
});
render();

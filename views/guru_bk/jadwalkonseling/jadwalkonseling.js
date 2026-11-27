const STORAGE_KEYS = {
    users: "bullyingcare_admin_users",
    reports: "sahabat_reports_demo_v1",
    handlings: "bullyingcare_case_handlings",
    sessions: "bullyingcare_counseling_sessions",
    activeCounselor: "bullyingcare_current_guru_bk_id"
};
const DEFAULT_USERS = [
    { id: 1, name: "Alya Putri", email: "alya@example.com", role: "siswa" },
    { id: 2, name: "Budi Santoso", email: "budi@example.com", role: "siswa" },
    { id: 3, name: "Dewi Lestari", email: "dewi.guru@example.com", role: "guru_bk" },
    { id: 4, name: "Rina Pratiwi", email: "rina.psikolog@example.com", role: "psikolog" },
    { id: 5, name: "Administrator", email: "admin@example.com", role: "admin" }
];
function readArray(key, label) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return [];
        const value = JSON.parse(stored);
        if (!Array.isArray(value)) throw new Error(`Format ${label} tidak valid.`);
        return value;
    } catch (error) {
        console.error(`Gagal membaca ${label} dari localStorage:`, error);
        return [];
    }
}
function readUsers() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.users);
        if (stored !== null) {
            const users = JSON.parse(stored);
            if (!Array.isArray(users)) throw new Error("Format data pengguna tidak valid.");
            return users;
        }
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS.map(user => ({ ...user }));
    } catch (error) {
        console.error("Gagal membaca pengguna lokal:", error);
        return [];
    }
}
const readReports = () => readArray(STORAGE_KEYS.reports, "laporan");
const readHandlings = () => readArray(STORAGE_KEYS.handlings, "penanganan kasus");
const readSessions = () => readArray(STORAGE_KEYS.sessions, "jadwal konseling");
function getActiveCounselor(users) {
    const counselors = users.filter(user => user.role === "guru_bk");
    const selectedId = localStorage.getItem(STORAGE_KEYS.activeCounselor);
    return counselors.find(user => String(user.id) === selectedId) || counselors[0] || null;
}
function saveLocalArray(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Gagal menyimpan ${key} ke localStorage:`, error);
        return false;
    }
}
function reportCode(report) {
    return report.reportCode || report.report_code || report.code || `LPR-${report.id}`;
}
function formatDate(value, withTime = false) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", withTime
        ? { dateStyle: "medium", timeStyle: "short" }
        : { day: "numeric", month: "short", year: "numeric" }
    ).format(date);
}
function makeCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "—";
    return cell;
}
function makeButton(label, action, id, destructive = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `guru-action-button${destructive ? " destructive" : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = String(id);
    return button;
}
function makeStatusBadge(status, labels = {}) {
    const badge = document.createElement("span");
    badge.className = `guru-status-badge ${status || ""}`;
    badge.textContent = labels[status] || status || "—";
    return badge;
}
function showEmptyRow(tableBody, message, columns) {
    const row = document.createElement("tr");
    const cell = makeCell(message);
    cell.className = "guru-empty-cell";
    cell.colSpan = columns;
    row.append(cell);
    tableBody.append(row);
}

const users = readUsers();
const counselor = getActiveCounselor(users);
const reports = readReports();
let handlings = readHandlings();
let sessions = readSessions();
const table = document.getElementById("sessionTable");
const modal = document.getElementById("sessionModal");
const form = document.getElementById("sessionForm");
let visibleSessions = [];
const labels = { dijadwalkan: "Dijadwalkan", selesai: "Selesai", dibatalkan: "Dibatalkan" };
function myHandlings() {
    return handlings.filter(item => counselor &&
        String(item.counselorId ?? item.counselor_id) === String(counselor.id));
}
function reportForHandling(item) {
    return reports.find(report => String(report.id) === String(item.reportId ?? item.report_id));
}
function dateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function selectOptions(select, options, placeholder, selected = "") {
    select.replaceChildren();
    const empty = document.createElement("option"); empty.value = ""; empty.textContent = placeholder; select.append(empty);
    options.forEach(item => { const option = document.createElement("option"); option.value = String(item.id); option.textContent = item.label; select.append(option); });
    select.value = String(selected || "");
}
function render() {
    const search = document.getElementById("sessionSearch").value.trim().toLocaleLowerCase("id");
    const status = document.getElementById("sessionFilter").value;
    const ownedHandlingIds = new Set(myHandlings().map(item => String(item.id)));
    visibleSessions = sessions.filter(session =>
        String(session.counselorId ?? session.counselor_id) === String(counselor?.id) &&
        ownedHandlingIds.has(String(session.handlingId ?? session.handling_id))
    ).filter(session => {
        const handling = handlings.find(item => String(item.id) === String(session.handlingId ?? session.handling_id));
        const report = handling && reportForHandling(handling);
        const student = users.find(user => String(user.id) === String(session.studentId ?? session.student_id));
        return `${student?.name || ""} ${report ? reportCode(report) : ""}`.toLocaleLowerCase("id").includes(search) &&
            (!status || session.sessionStatus === status);
    }).sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));

    table.replaceChildren();
    if (!visibleSessions.length) showEmptyRow(table, "Belum ada jadwal konseling untuk profil Guru BK ini.", 6);
    visibleSessions.forEach((session, index) => {
        const handling = handlings.find(item => String(item.id) === String(session.handlingId ?? session.handling_id));
        const report = handling && reportForHandling(handling);
        const student = users.find(user => String(user.id) === String(session.studentId ?? session.student_id));
        const row = document.createElement("tr");
        row.append(makeCell(dateTime(session.sessionDate ?? session.session_date)));
        row.append(makeCell(student?.name || "Tidak ditentukan"));
        row.append(makeCell(report ? reportCode(report) : "Laporan tidak ditemukan"));
        row.append(makeCell(session.sessionType === "online" ? "Online" : "Tatap muka"));
        const statusCell = document.createElement("td");
        statusCell.append(makeStatusBadge(session.sessionStatus, labels));
        row.append(statusCell);
        const actionCell = document.createElement("td");
        const group = document.createElement("div"); group.className = "guru-action-group";
        const edit = makeButton("Ubah", "edit", session.id); edit.dataset.index = String(index);
        const remove = makeButton("Hapus", "delete", session.id, true);
        group.append(edit, remove); actionCell.append(group); row.append(actionCell); table.append(row);
    });
    document.getElementById("sessionSummary").textContent =
        `Menampilkan ${visibleSessions.length} jadwal untuk ${counselor?.name || "Guru BK"}`;
}
function toLocalDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function open(session = null) {
    form.reset();
    const error = document.getElementById("sessionError"); error.hidden = true;
    document.getElementById("sessionId").value = session ? String(session.id) : "";
    document.getElementById("sessionModalTitle").textContent = session ? "Ubah Jadwal" : "Jadwalkan Konseling";
    const own = myHandlings();
    selectOptions(document.getElementById("sessionHandling"), own.map(item => {
        const report = reportForHandling(item);
        return { id: item.id, label: report ? `${reportCode(report)} — ${report.title || "Laporan"}` : item.reportCode || `Kasus ${item.id}` };
    }), "Pilih penanganan", session?.handlingId ?? session?.handling_id);
    selectOptions(document.getElementById("sessionStudent"), users.filter(user => user.role === "siswa").map(user => ({ id: user.id, label: user.name })), "Tidak ditentukan", session?.studentId ?? session?.student_id);
    document.getElementById("sessionDate").value = toLocalDateTime(session?.sessionDate ?? session?.session_date);
    document.getElementById("sessionType").value = session?.sessionType ?? session?.session_type ?? "tatap_muka";
    document.getElementById("sessionStatus").value = session?.sessionStatus ?? session?.session_status ?? "dijadwalkan";
    document.getElementById("sessionNotes").value = session?.notes || "";
    if (!counselor || !own.length) {
        error.textContent = !counselor
            ? "Tambahkan pengguna dengan role Guru BK terlebih dahulu."
            : "Buat penanganan kasus untuk Guru BK aktif sebelum menjadwalkan sesi.";
        error.hidden = false;
    }
    modal.hidden = false;
}
function close() { modal.hidden = true; form.reset(); }
document.getElementById("addSession").addEventListener("click", () => open());
document.getElementById("closeSession").addEventListener("click", close);
document.getElementById("cancelSession").addEventListener("click", close);
document.getElementById("sessionSearch").addEventListener("input", render);
document.getElementById("sessionFilter").addEventListener("change", render);
document.getElementById("resetSessionFilters").addEventListener("click", () => {
    document.getElementById("sessionSearch").value = "";
    document.getElementById("sessionFilter").value = "";
    render();
});
modal.addEventListener("click", event => { if (event.target === modal) close(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) close(); });
table.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const session = sessions.find(item => String(item.id) === button.dataset.id);
    if (!session || String(session.counselorId ?? session.counselor_id) !== String(counselor?.id)) return;
    if (button.dataset.action === "edit") { open(session); return; }
    if (!confirm("Hapus jadwal konseling ini?")) return;
    const previous = sessions;
    sessions = sessions.filter(item => item.id !== session.id);
    if (saveLocalArray(STORAGE_KEYS.sessions, sessions)) render();
    else { sessions = previous; alert("Jadwal gagal dihapus dari localStorage."); }
});
form.addEventListener("submit", event => {
    event.preventDefault();
    const error = document.getElementById("sessionError"); error.hidden = true;
    const id = document.getElementById("sessionId").value;
    const existing = sessions.find(item => String(item.id) === id);
    const handling = myHandlings().find(item => String(item.id) === document.getElementById("sessionHandling").value);
    if (!counselor || !handling) {
        error.textContent = !counselor ? "Profil Guru BK tidak tersedia." : "Pilih penanganan kasus milik Guru BK aktif.";
        error.hidden = false;
        return;
    }
    const dateValue = document.getElementById("sessionDate").value;
    const date = new Date(dateValue);
    if (!dateValue || Number.isNaN(date.getTime())) {
        error.textContent = "Tanggal dan waktu sesi tidak valid.";
        error.hidden = false;
        return;
    }
    const now = new Date().toISOString();
    const session = {
        ...(existing || {}),
        id: existing?.id || sessions.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
        handlingId: handling.id,
        studentId: document.getElementById("sessionStudent").value || null,
        counselorId: counselor.id,
        sessionDate: date.toISOString(),
        sessionType: document.getElementById("sessionType").value,
        sessionStatus: document.getElementById("sessionStatus").value,
        notes: document.getElementById("sessionNotes").value.trim(),
        createdAt: existing?.createdAt || now,
        updatedAt: now
    };
    const previous = sessions;
    sessions = existing ? sessions.map(item => item.id === existing.id ? session : item) : [...sessions, session];
    if (saveLocalArray(STORAGE_KEYS.sessions, sessions)) { close(); render(); }
    else { sessions = previous; error.textContent = "Jadwal gagal disimpan ke localStorage."; error.hidden = false; }
});
render();

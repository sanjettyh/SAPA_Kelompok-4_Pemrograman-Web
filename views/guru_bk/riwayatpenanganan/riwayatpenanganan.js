const DATA_KEYS = {
    users: "bullyingcare_admin_users",
    handlings: "bullyingcare_case_handlings",
    reports: "sahabat_reports_demo_v1",
    handlingHistories: "bullyingcare_case_handling_histories",
    reportHistories: "bullyingcare_report_histories",
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
        const stored = localStorage.getItem(DATA_KEYS.users);
        if (stored !== null) {
            const users = JSON.parse(stored);
            if (!Array.isArray(users)) throw new Error("Format data pengguna tidak valid.");
            return users;
        }
        localStorage.setItem(DATA_KEYS.users, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS.map(user => ({ ...user }));
    } catch (error) {
        console.error("Gagal membaca pengguna lokal:", error);
        return [];
    }
}
const readHandlings = () => readArray(DATA_KEYS.handlings, "penanganan kasus");
const readReports = () => readArray(DATA_KEYS.reports, "laporan");
const readHandlingHistories = () => readArray(DATA_KEYS.handlingHistories, "riwayat penanganan");
const readReportHistories = () => readArray(DATA_KEYS.reportHistories, "riwayat laporan");
function getActiveCounselor(users) {
    const counselors = users.filter(user => user.role === "guru_bk");
    const selectedId = localStorage.getItem(DATA_KEYS.activeCounselor);
    return counselors.find(user => String(user.id) === selectedId) || counselors[0] || null;
}
function reportCode(report) {
    return report.reportCode || report.report_code || report.code || `LPR-${report.id}`;
}
function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric", month: "short", year: "numeric"
    }).format(date);
}
function makeCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value ?? "—";
    if (className) cell.className = className;
    return cell;
}
function showEmptyRow(tableBody, message, columns) {
    const row = document.createElement("tr");
    const cell = makeCell(message, "guru-empty-cell");
    cell.colSpan = columns;
    row.append(cell);
    tableBody.append(row);
}

const users = readUsers();
const counselor = getActiveCounselor(users);
const handlings = readHandlings();
const reports = readReports();
const handlingHistory = readHandlingHistories();
const reportHistory = readReportHistories();
const table = document.getElementById("historyTable");
const statusNames = {
    menunggu: "Menunggu", diverifikasi: "Diverifikasi", diproses: "Diproses",
    pendampingan: "Pendampingan", selesai: "Selesai", ditolak: "Ditolak",
    belum_ditangani: "Belum ditangani", sedang_ditangani: "Sedang ditangani"
};
function reportFor(id) {
    return reports.find(report => String(report.id) === String(id));
}
function ownedReportIds() {
    const ids = new Set();
    handlings.forEach(item => {
        if (String(item.counselorId ?? item.counselor_id) === String(counselor?.id)) {
            ids.add(String(item.reportId ?? item.report_id));
        }
    });
    return ids;
}
function entries() {
    const owned = ownedReportIds();
    const rows = [];
    handlingHistory.forEach(item => {
        if (String(item.changedBy ?? item.changed_by) !== String(counselor?.id)) return;
        const report = reportFor(item.reportId ?? item.report_id);
        if (!report) return;
        rows.push({
            type: "penanganan",
            report,
            oldStatus: item.oldStatus ?? item.old_status,
            newStatus: item.newStatus ?? item.new_status,
            notes: item.notes || "",
            changedAt: item.changedAt ?? item.changed_at
        });
    });
    reportHistory.forEach(item => {
        const report = reportFor(item.reportId ?? item.report_id);
        if (!report || !owned.has(String(report.id))) return;
        rows.push({
            type: "laporan",
            report,
            oldStatus: item.oldStatus ?? item.old_status,
            newStatus: item.newStatus ?? item.new_status,
            notes: item.notes || "",
            changedAt: item.changedAt ?? item.changed_at
        });
    });
    return rows.sort((a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0));
}
function formatTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? formatDate(value) : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function render() {
    const search = document.getElementById("historySearch").value.trim().toLocaleLowerCase("id");
    const type = document.getElementById("historyType").value;
    const all = entries();
    const filtered = all.filter(item => {
        const text = `${reportCode(item.report)} ${item.report.category || ""} ${item.notes || ""} ${item.report.description || ""}`.toLocaleLowerCase("id");
        return text.includes(search) && (!type || item.type === type);
    });
    table.replaceChildren();
    if (!filtered.length) showEmptyRow(table, "Belum ada riwayat penanganan yang cocok.", 5);
    filtered.forEach(item => {
        const row = document.createElement("tr");
        row.append(makeCell(formatTime(item.changedAt)));
        row.append(makeCell(reportCode(item.report)));
        row.append(makeCell(item.type === "penanganan" ? "Penanganan kasus" : "Status laporan"));
        row.append(makeCell(`${statusNames[item.oldStatus] || item.oldStatus || "Awal"} → ${statusNames[item.newStatus] || item.newStatus || "—"}`));
        row.append(makeCell(item.notes || "—", "wrap-cell"));
        table.append(row);
    });
    document.getElementById("historySummary").textContent =
        `Menampilkan ${filtered.length} dari ${all.length} aktivitas untuk ${counselor?.name || "Guru BK"}`;
}
document.getElementById("historySearch").addEventListener("input", render);
document.getElementById("historyType").addEventListener("change", render);
document.getElementById("resetHistoryFilters").addEventListener("click", () => {
    document.getElementById("historySearch").value = "";
    document.getElementById("historyType").value = "";
    render();
});
render();

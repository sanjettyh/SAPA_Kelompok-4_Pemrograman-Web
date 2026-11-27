const DATA_KEYS = {
    users: "bullyingcare_admin_users",
    categories: "bullyingcare_admin_categories",
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
const readCategories = () => readArray(DATA_KEYS.categories, "kategori");
const readReports = () => readArray(DATA_KEYS.reports, "laporan");
const readHandlings = () => readArray(DATA_KEYS.handlings, "penanganan kasus");
const readSessions = () => readArray(DATA_KEYS.sessions, "jadwal konseling");
function getActiveCounselor(users) {
    const counselors = users.filter(user => user.role === "guru_bk");
    const selectedId = localStorage.getItem(DATA_KEYS.activeCounselor);
    return counselors.find(user => String(user.id) === selectedId) || counselors[0] || null;
}
function reportCode(report) {
    return report.reportCode || report.report_code || report.code || `LPR-${report.id}`;
}
function reportCategory(report, categories = readCategories()) {
    const category = categories.find(item =>
        String(item.id) === String(report.categoryId ?? report.category_id)
    );
    return category?.name || report.category || report.categoryName || "Kategori tidak ditemukan";
}
function reporterName(report, users = readUsers()) {
    if (report.isAnonymous || report.is_anonymous || report.anonymous) return "Anonim";
    const user = users.find(item =>
        String(item.id) === String(report.reporterId ?? report.reporter_id)
    );
    return user?.name || report.reporterName || report.reporter || "Tidak diketahui";
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
const categories = readCategories();
const handlings = readHandlings().filter(item =>
    counselor && String(item.counselorId ?? item.counselor_id) === String(counselor.id)
);
const reportById = id => reports.find(report => String(report.id) === String(id));
const today = new Date();
today.setHours(0, 0, 0, 0);

document.getElementById("reportCount").textContent = String(reports.length);
document.getElementById("handlingCount").textContent = String(handlings.length);
document.getElementById("activeHandlingCount").textContent =
    String(handlings.filter(item => item.handlingStatus === "sedang_ditangani").length);

const sessions = readSessions()
    .filter(session => counselor && String(session.counselorId ?? session.counselor_id) === String(counselor.id))
    .filter(session => session.sessionStatus === "dijadwalkan" && new Date(session.sessionDate) >= today)
    .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate));
document.getElementById("upcomingSessionCount").textContent = String(sessions.length);

const casesBody = document.getElementById("dashboardCases");
const latestHandlings = [...handlings]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 5);
if (latestHandlings.length === 0) {
    showEmptyRow(casesBody, "Belum ada kasus yang ditugaskan kepada profil Guru BK ini.", 5);
} else {
    latestHandlings.forEach(handling => {
        const report = reportById(handling.reportId ?? handling.report_id);
        const row = document.createElement("tr");
        row.append(makeCell(report ? reportCode(report) : handling.reportCode || "Laporan tidak ditemukan"));
        row.append(makeCell(report ? reportCategory(report, categories) : "—"));
        row.append(makeCell(report ? reporterName(report, users) : "—"));
        const status = document.createElement("td");
        status.append(makeStatusBadge(handling.handlingStatus, {
            belum_ditangani: "Belum ditangani",
            sedang_ditangani: "Sedang ditangani",
            selesai: "Selesai"
        }));
        row.append(status, makeCell(formatDate(handling.handlingDate)));
        casesBody.append(row);
    });
}

const sessionBody = document.getElementById("dashboardSessions");
const upcomingSessions = sessions.slice(0, 5);
if (upcomingSessions.length === 0) {
    showEmptyRow(sessionBody, "Belum ada sesi konseling mendatang.", 4);
} else {
    upcomingSessions.forEach(session => {
        const student = users.find(user => String(user.id) === String(session.studentId ?? session.student_id));
        const row = document.createElement("tr");
        row.append(makeCell(student?.name || "Siswa tidak ditentukan"));
        row.append(makeCell(formatDate(session.sessionDate, true)));
        row.append(makeCell(session.sessionType === "online" ? "Online" : "Tatap muka"));
        const status = document.createElement("td");
        status.append(makeStatusBadge(session.sessionStatus, { dijadwalkan: "Dijadwalkan" }));
        row.append(status);
        sessionBody.append(row);
    });
}

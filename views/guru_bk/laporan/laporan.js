const STORAGE_KEYS = {
    users: "bullyingcare_admin_users",
    categories: "bullyingcare_admin_categories",
    reports: "sahabat_reports_demo_v1"
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
const readCategories = () => readArray(STORAGE_KEYS.categories, "kategori");
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
function makeStatusBadge(status, labels = {}) {
    const badge = document.createElement("span");
    badge.className = `guru-status-badge ${status || ""}`;
    badge.textContent = labels[status] || status || "—";
    return badge;
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
function showEmptyRow(tableBody, message, columns) {
    const row = document.createElement("tr");
    const cell = makeCell(message, "guru-empty-cell");
    cell.colSpan = columns;
    row.append(cell);
    tableBody.append(row);
}

const reports = readReports();
const users = readUsers();
const categories = readCategories();
const body = document.getElementById("reportTable");
const modal = document.getElementById("reportModal");
let filteredReports = [];
const labels = {
    menunggu: "Menunggu", diverifikasi: "Diverifikasi", diproses: "Diproses",
    pendampingan: "Pendampingan", selesai: "Selesai", ditolak: "Ditolak"
};
const cellValue = (report, camel, snake, fallback = "") => report[camel] ?? report[snake] ?? fallback;

function render() {
    const search = document.getElementById("reportSearch").value.trim().toLocaleLowerCase("id");
    const status = document.getElementById("reportStatusFilter").value;
    filteredReports = reports.filter(report => {
        const searchable = [
            reportCode(report), reporterName(report, users), reportCategory(report, categories),
            cellValue(report, "incidentLocation", "incident_location", report.location),
            report.description
        ].join(" ").toLocaleLowerCase("id");
        return searchable.includes(search) && (!status || (report.status || "menunggu") === status);
    }).sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

    body.replaceChildren();
    if (!filteredReports.length) showEmptyRow(body, "Belum ada laporan yang cocok dengan pencarian/filter.", 7);
    filteredReports.forEach((report, index) => {
        const row = document.createElement("tr");
        row.append(makeCell(reportCode(report)), makeCell(reporterName(report, users)), makeCell(reportCategory(report, categories)));
        row.append(makeCell(formatDate(cellValue(report, "incidentDate", "incident_date", report.date))));
        row.append(makeCell(cellValue(report, "incidentLocation", "incident_location", report.location || "—"), "wrap-cell"));
        const statusCell = document.createElement("td");
        statusCell.append(makeStatusBadge(report.status || "menunggu", labels));
        row.append(statusCell);
        const detailCell = document.createElement("td");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "guru-action-button";
        button.textContent = "Detail";
        button.dataset.index = String(index);
        detailCell.append(button);
        row.append(detailCell);
        body.append(row);
    });
    document.getElementById("reportSummary").textContent =
        `Menampilkan ${filteredReports.length} dari ${reports.length} laporan`;
}

function addDetail(list, label, value) {
    const term = document.createElement("dt"); term.textContent = label;
    const description = document.createElement("dd"); description.textContent = value || "—";
    list.append(term, description);
}
function openReport(report) {
    document.getElementById("reportModalTitle").textContent = report.title || "Detail Laporan";
    document.getElementById("reportModalCode").textContent = reportCode(report);
    const details = document.getElementById("reportDetails");
    details.replaceChildren();
    addDetail(details, "Pelapor", reporterName(report, users));
    addDetail(details, "Kategori", reportCategory(report, categories));
    addDetail(details, "Tanggal kejadian", formatDate(cellValue(report, "incidentDate", "incident_date", report.date)));
    addDetail(details, "Lokasi", cellValue(report, "incidentLocation", "incident_location", report.location));
    addDetail(details, "Status", labels[report.status] || "Menunggu");
    addDetail(details, "Anonim", cellValue(report, "isAnonymous", "is_anonymous", report.anonymous) ? "Ya" : "Tidak");
    addDetail(details, "Deskripsi", report.description);
    addDetail(details, "Dibuat", formatDate(cellValue(report, "createdAt", "created_at")));
    modal.hidden = false;
}
function closeModal() { modal.hidden = true; }

document.getElementById("reportSearch").addEventListener("input", render);
document.getElementById("reportStatusFilter").addEventListener("change", render);
document.getElementById("resetReportFilters").addEventListener("click", () => {
    document.getElementById("reportSearch").value = "";
    document.getElementById("reportStatusFilter").value = "";
    render();
});
body.addEventListener("click", event => {
    const button = event.target.closest("button[data-index]");
    if (button) openReport(filteredReports[Number(button.dataset.index)]);
});
document.getElementById("closeReportModal").addEventListener("click", closeModal);
document.getElementById("dismissReportModal").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
render();

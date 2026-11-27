const REPORT_STORAGE_KEY = "sahabat_reports_demo_v1";
const CATEGORY_STORAGE_KEY = "bullyingcare_admin_categories";
const USER_STORAGE_KEY = "bullyingcare_admin_users";
const STATUS_LABELS = {
    menunggu: "Menunggu",
    diverifikasi: "Diverifikasi",
    diproses: "Diproses",
    pendampingan: "Pendampingan",
    selesai: "Selesai",
    ditolak: "Ditolak"
};
const DEFAULT_CATEGORIES = [
    { id: 1, name: "Bullying Fisik", description: "Tindakan menyakiti atau mengancam secara fisik.", createdAt: "2026-10-01T08:00:00.000Z" },
    { id: 2, name: "Bullying Verbal", description: "Perkataan yang menghina, mengejek, atau mengancam.", createdAt: "2026-10-01T08:00:00.000Z" },
    { id: 3, name: "Bullying Sosial", description: "Tindakan mengucilkan atau merusak hubungan sosial.", createdAt: "2026-10-01T08:00:00.000Z" },
    { id: 4, name: "Cyberbullying", description: "Perundungan melalui media digital.", createdAt: "2026-10-01T08:00:00.000Z" }
];

const reportTable = document.getElementById("reportTable");
const reportModal = document.getElementById("reportModal");
const detailModal = document.getElementById("detailModal");
const reportForm = document.getElementById("reportForm");
const formError = document.getElementById("reportFormError");
let reports = loadReports();
let categories = loadCategories();
let users = loadUsers();

function readLocalArray(key, label, fallback = []) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return fallback;
        const value = JSON.parse(stored);
        if (!Array.isArray(value)) throw new Error(`Format data ${label} tidak valid.`);
        return value;
    } catch (error) {
        alert(`Data ${label} tidak dapat dibaca: ${error.message}`);
        return fallback;
    }
}

function loadReports() {
    return readLocalArray(REPORT_STORAGE_KEY, "laporan");
}

function loadCategories() {
    try {
        const stored = localStorage.getItem(CATEGORY_STORAGE_KEY);
        if (stored !== null) {
            const value = JSON.parse(stored);
            if (!Array.isArray(value)) throw new Error("Format data kategori tidak valid.");
            return value;
        }

        localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES.map(category => ({ ...category }));
    } catch (error) {
        alert(`Data kategori tidak dapat dibaca atau disimpan: ${error.message}`);
        return [];
    }
}

function loadUsers() {
    return readLocalArray(USER_STORAGE_KEY, "pengguna");
}

function saveReports() {
    try {
        localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports));
        return true;
    } catch {
        return false;
    }
}

function normalizedName(value) {
    return String(value || "")
        .toLocaleLowerCase("id")
        .replace(/^bullying\s+/, "")
        .replace("cyber", "siber")
        .replace(/\s+bullying$/, "")
        .trim();
}

function findCategoryName(report) {
    const category = categories.find(item => String(item.id) === String(report.categoryId));
    if (category) return category.name;
    return report.category || report.categoryName || "Kategori tidak ditemukan";
}

function reportCode(report) {
    if (report.reportCode) return report.reportCode;
    if (report.code) return report.code;
    const suffix = String(report.id || "").slice(-8).padStart(8, "0");
    return `LPR-${suffix}`;
}

function reportDate(report) {
    return report.incidentDate || report.date || "";
}

function reporterName(report) {
    if (report.isAnonymous || report.anonymous) return "Anonim";
    const reporter = users.find(user => String(user.id) === String(report.reporterId ?? report.reporter_id));
    return reporter?.name || report.reporterName || report.reporter || "Tidak diketahui";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value;
    if (className) cell.className = className;
    return cell;
}

function createActionButton(label, action, id, isDelete = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `report-action-button${isDelete ? " delete" : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = String(id);
    button.setAttribute("aria-label", `${label} laporan ${reportCode(reports.find(report => String(report.id) === String(id)) || {})}`);
    return button;
}

function renderReports() {
    const searchTerm = document.getElementById("searchReports").value.trim().toLocaleLowerCase("id");
    const statusFilter = document.getElementById("filterStatus").value;
    const dateFilter = document.getElementById("filterDate").value;
    const filteredReports = reports.filter(report => {
        const searchableText = [
            reportCode(report),
            reporterName(report),
            findCategoryName(report),
            report.incidentLocation || report.location || "",
            report.title || "",
            report.description || ""
        ].join(" ").toLocaleLowerCase("id");

        return searchableText.includes(searchTerm) &&
            (!statusFilter || (report.status || "menunggu") === statusFilter) &&
            (!dateFilter || reportDate(report) === dateFilter);
    });

    reportTable.replaceChildren();
    document.getElementById("reportSummary").textContent =
        `Menampilkan ${filteredReports.length} dari ${reports.length} laporan`;

    if (filteredReports.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("Belum ada laporan atau tidak ada laporan yang cocok dengan filter.");
        cell.colSpan = 6;
        cell.className = "report-empty-row";
        row.append(cell);
        reportTable.append(row);
    } else {
        filteredReports.forEach(report => {
            const row = document.createElement("tr");
            row.append(createCell(reportCode(report)));
            row.append(createCell(reporterName(report)));
            row.append(createCell(findCategoryName(report)));
            row.append(createCell(formatDate(reportDate(report))));

            const statusCell = document.createElement("td");
            const status = report.status || "menunggu";
            const badge = document.createElement("span");
            badge.className = `report-status report-status-${status}`;
            badge.textContent = STATUS_LABELS[status] || STATUS_LABELS.menunggu;
            statusCell.append(badge);
            row.append(statusCell);

            const actionsCell = document.createElement("td");
            const actionGroup = document.createElement("div");
            actionGroup.className = "report-action-group";
            actionGroup.append(createActionButton("Detail", "detail", report.id));
            actionGroup.append(createActionButton("Ubah", "edit", report.id));
            actionGroup.append(createActionButton("Hapus", "delete", report.id, true));
            actionsCell.append(actionGroup);
            row.append(actionsCell);
            reportTable.append(row);
        });
    }

    document.getElementById("totalReports").textContent = String(reports.length);
    document.getElementById("waitingReports").textContent =
        String(reports.filter(report => (report.status || "menunggu") === "menunggu").length);
    document.getElementById("processingReports").textContent =
        String(reports.filter(report => ["diverifikasi", "diproses", "pendampingan"].includes(report.status)).length);
    document.getElementById("completedReports").textContent =
        String(reports.filter(report => report.status === "selesai").length);
}

function populateSelect(select, options, placeholder) {
    select.replaceChildren();
    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = placeholder;
    select.append(firstOption);

    options.forEach(item => {
        const option = document.createElement("option");
        option.value = String(item.id);
        option.textContent = item.name;
        select.append(option);
    });
}

function generateReportCode() {
    const date = new Date();
    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("");
    let sequence = 1;
    let code = "";

    do {
        code = `LPR-${datePart}-${String(sequence).padStart(4, "0")}`;
        sequence += 1;
    } while (reports.some(report => reportCode(report) === code));

    return code;
}

function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
}

function openReportModal(report = null) {
    reportForm.reset();
    formError.hidden = true;
    formError.textContent = "";
    document.getElementById("reportId").value = report ? String(report.id) : "";
    document.getElementById("reportModalTitle").textContent =
        report ? "Ubah Laporan" : "Tambah Laporan";

    const categoryOptions = categories.map(category => ({ id: category.id, name: category.name }));
    const reporterOptions = users.map(user => ({ id: user.id, name: `${user.name} (${user.email})` }));
    populateSelect(document.getElementById("categoryId"), categoryOptions, "Pilih kategori");
    populateSelect(document.getElementById("reporterId"), reporterOptions, "Tidak ditentukan");
    document.getElementById("reportCode").value = report ? reportCode(report) : generateReportCode();
    document.getElementById("reportStatus").value = report?.status || "menunggu";

    if (report) {
        const chosenCategory = categories.find(category => String(category.id) === String(report.categoryId)) ||
            categories.find(category => normalizedName(category.name) === normalizedName(report.category));
        document.getElementById("categoryId").value = chosenCategory ? String(chosenCategory.id) : "";
        document.getElementById("reporterId").value =
            String(report.reporterId ?? report.reporter_id ?? "");
        document.getElementById("isAnonymous").checked = Boolean(report.isAnonymous ?? report.anonymous);
        document.getElementById("incidentDate").value = reportDate(report);
        document.getElementById("incidentLocation").value =
            report.incidentLocation || report.location || "";
        document.getElementById("reportDescription").value = report.description || "";
    } else {
        document.getElementById("incidentDate").value = new Date().toISOString().slice(0, 10);
    }

    if (categories.length === 0) {
        showFormError("Tambahkan kategori terlebih dahulu sebelum membuat laporan.");
    }

    reportModal.hidden = false;
    document.getElementById("categoryId").focus();
}

function closeReportModal() {
    reportModal.hidden = true;
    reportForm.reset();
}

function closeDetailModal() {
    detailModal.hidden = true;
}

function addDetailRow(list, label, value) {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value || "—";
    list.append(term, description);
}

function openDetailModal(report) {
    document.getElementById("detailTitle").textContent = report.title || "Detail Laporan";
    document.getElementById("detailCode").textContent = reportCode(report);

    const details = document.getElementById("reportDetails");
    details.replaceChildren();
    addDetailRow(details, "Pelapor", reporterName(report));
    addDetailRow(details, "Kategori", findCategoryName(report));
    addDetailRow(details, "Tanggal kejadian", formatDate(reportDate(report)));
    addDetailRow(details, "Lokasi", report.incidentLocation || report.location || "");
    addDetailRow(details, "Status", STATUS_LABELS[report.status] || STATUS_LABELS.menunggu);
    addDetailRow(details, "Kronologi", report.description || "");
    addDetailRow(details, "Dibuat pada", formatDate(report.createdAt));
    detailModal.hidden = false;
}

document.getElementById("addReportButton").addEventListener("click", () => openReportModal());
document.getElementById("closeReportModal").addEventListener("click", closeReportModal);
document.getElementById("cancelReport").addEventListener("click", closeReportModal);
document.getElementById("closeDetailModal").addEventListener("click", closeDetailModal);
document.getElementById("closeDetailButton").addEventListener("click", closeDetailModal);

["searchReports", "filterStatus", "filterDate"].forEach(id => {
    document.getElementById(id).addEventListener(id === "searchReports" ? "input" : "change", renderReports);
});

document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchReports").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterDate").value = "";
    renderReports();
});

reportModal.addEventListener("click", event => {
    if (event.target === reportModal) closeReportModal();
});

detailModal.addEventListener("click", event => {
    if (event.target === detailModal) closeDetailModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (!reportModal.hidden) closeReportModal();
        if (!detailModal.hidden) closeDetailModal();
    }
});

document.getElementById("isAnonymous").addEventListener("change", event => {
    const reporterSelect = document.getElementById("reporterId");
    reporterSelect.disabled = event.target.checked;
    if (event.target.checked) reporterSelect.value = "";
});

reportTable.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const report = reports.find(item => String(item.id) === button.dataset.id);
    if (!report) return;

    if (button.dataset.action === "detail") {
        openDetailModal(report);
    } else if (button.dataset.action === "edit") {
        openReportModal(report);
    } else if (button.dataset.action === "delete" && confirm(`Hapus laporan ${reportCode(report)}?`)) {
        const previousReports = reports;
        reports = reports.filter(item => item.id !== report.id);
        if (saveReports()) {
            renderReports();
        } else {
            reports = previousReports;
            alert("Laporan gagal dihapus karena browser tidak dapat menyimpan perubahan.");
        }
    }
});

reportForm.addEventListener("submit", event => {
    event.preventDefault();
    formError.hidden = true;

    const idValue = document.getElementById("reportId").value;
    const existingReport = reports.find(report => String(report.id) === idValue);
    const categoryId = document.getElementById("categoryId").value;
    const category = categories.find(item => String(item.id) === categoryId);

    if (!category) {
        showFormError("Pilih kategori laporan yang valid.");
        return;
    }

    const anonymous = document.getElementById("isAnonymous").checked;
    const reporterIdValue = document.getElementById("reporterId").value;
    const reporter = users.find(user => String(user.id) === reporterIdValue);
    const now = new Date().toISOString();
    const createdAt = existingReport?.createdAt || Date.now();
    const report = {
        ...(existingReport || {}),
        id: existingReport?.id || `admin-${Date.now()}`,
        reportCode: existingReport ? reportCode(existingReport) : generateReportCode(),
        reporterId: anonymous || !reporter ? null : reporter.id,
        categoryId: category.id,
        incidentDate: document.getElementById("incidentDate").value,
        incidentLocation: document.getElementById("incidentLocation").value.trim(),
        description: document.getElementById("reportDescription").value.trim(),
        isAnonymous: anonymous,
        status: document.getElementById("reportStatus").value,
        title: existingReport?.title || reportCode(existingReport || {}),
        category: category.name,
        date: document.getElementById("incidentDate").value,
        location: document.getElementById("incidentLocation").value.trim(),
        anonymous,
        reporterName: anonymous ? "" : reporter?.name || "",
        createdAt,
        updatedAt: now
    };

    const previousReports = reports;
    reports = existingReport
        ? reports.map(item => item.id === existingReport.id ? report : item)
        : [...reports, report];

    if (saveReports()) {
        closeReportModal();
        renderReports();
    } else {
        reports = previousReports;
        showFormError("Laporan gagal disimpan karena browser tidak dapat menyimpan perubahan.");
    }
});

renderReports();

const REPORT_KEY = "sahabat_reports_demo_v1";
const HISTORY_KEY = "bullyingcare_report_histories";
const CATEGORY_KEY = "bullyingcare_admin_categories";
const USER_KEY = "bullyingcare_admin_users";
const STATUS_LABELS = {
    menunggu: "Menunggu",
    diverifikasi: "Diverifikasi",
    diproses: "Diproses",
    pendampingan: "Pendampingan",
    selesai: "Selesai",
    ditolak: "Ditolak"
};
const table = document.getElementById("historyTable");
const modal = document.getElementById("historyModal");
let reports = readArray(REPORT_KEY, "laporan");
let histories = readArray(HISTORY_KEY, "riwayat status");
let categories = readArray(CATEGORY_KEY, "kategori");
let users = readArray(USER_KEY, "pengguna");
let visibleEntries = [];

function readArray(key, label) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return [];
        const value = JSON.parse(stored);
        if (!Array.isArray(value)) throw new Error(`Format data ${label} tidak valid.`);
        return value;
    } catch (error) {
        alert(`Data ${label} gagal dibaca: ${error.message}`);
        return [];
    }
}

function reportCode(report) {
    if (report.reportCode || report.report_code) return report.reportCode || report.report_code;
    if (report.code) return report.code;
    return `LPR-${String(report.id || "").slice(-8).padStart(8, "0")}`;
}

function reportCategory(report) {
    const category = categories.find(item =>
        String(item.id) === String(report.categoryId ?? report.category_id)
    );
    return category?.name || report.category || report.categoryName || "Kategori tidak ditemukan";
}

function reporterName(report) {
    if (report.isAnonymous || report.is_anonymous || report.anonymous) return "Anonim";
    const user = users.find(item =>
        String(item.id) === String(report.reporterId ?? report.reporter_id)
    );
    return user?.name || report.reporterName || report.reporter || "Tidak diketahui";
}

function userName(userId) {
    if (userId === null || userId === undefined || userId === "") return "—";
    return users.find(user => String(user.id) === String(userId))?.name || "Pengguna tidak ditemukan";
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function statusLabel(status) {
    return STATUS_LABELS[status] || status || "Menunggu";
}

function buildHistoryEntries() {
    const entries = [];

    histories.forEach(history => {
        const reportId = history.reportId ?? history.report_id;
        const report = reports.find(item => String(item.id) === String(reportId));
        if (!report) return;

        entries.push({
            id: history.id ?? `history-${reportId}-${history.changedAt ?? history.changed_at}`,
            report,
            oldStatus: history.oldStatus ?? history.old_status ?? "",
            newStatus: history.newStatus ?? history.new_status ?? report.status ?? "menunggu",
            notes: history.notes || "",
            changedBy: history.changedBy ?? history.changed_by,
            changedAt: history.changedAt ?? history.changed_at ?? report.updatedAt ?? report.updated_at ?? report.createdAt ?? report.created_at,
            isInitial: false
        });
    });

    reports.forEach(report => {
        const hasHistory = histories.some(history =>
            String(history.reportId ?? history.report_id) === String(report.id)
        );
        if (hasHistory) return;

        entries.push({
            id: `initial-${report.id}`,
            report,
            oldStatus: "",
            newStatus: report.status || "menunggu",
            notes: "Riwayat perubahan belum tersedia. Status ini diambil dari data laporan.",
            changedBy: null,
            changedAt: report.createdAt ?? report.created_at,
            isInitial: true
        });
    });

    return entries.sort((a, b) => {
        const timeA = new Date(a.changedAt || 0).getTime() || 0;
        const timeB = new Date(b.changedAt || 0).getTime() || 0;
        return timeB - timeA;
    });
}

function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value;
    if (className) cell.className = className;
    return cell;
}

function createStatusTransition(entry) {
    const wrapper = document.createElement("span");
    wrapper.className = "history-transition";

    if (entry.oldStatus) {
        const previous = document.createElement("span");
        previous.className = "local-data-badge";
        previous.textContent = statusLabel(entry.oldStatus);
        const arrow = document.createElement("span");
        arrow.className = "history-status-arrow";
        arrow.textContent = "→";
        wrapper.append(previous, arrow);
    } else {
        const initial = document.createElement("span");
        initial.className = "history-current-status";
        initial.textContent = entry.isInitial ? "Status saat ini:" : "Status awal:";
        wrapper.append(initial);
    }

    const current = document.createElement("span");
    current.className = `local-data-badge ${entry.newStatus}`;
    current.textContent = statusLabel(entry.newStatus);
    wrapper.append(current);
    return wrapper;
}

function render() {
    const searchTerm = document.getElementById("historySearch").value.trim().toLocaleLowerCase("id");
    const statusFilter = document.getElementById("historyStatus").value;
    const entries = buildHistoryEntries();
    visibleEntries = entries.filter(entry => {
        const searchable = [
            reportCode(entry.report),
            reporterName(entry.report),
            reportCategory(entry.report),
            entry.notes,
            userName(entry.changedBy)
        ].join(" ").toLocaleLowerCase("id");
        return searchable.includes(searchTerm) && (!statusFilter || entry.newStatus === statusFilter);
    });

    table.replaceChildren();
    document.getElementById("historyCount").textContent = `${entries.length} aktivitas`;
    document.getElementById("historySummary").textContent =
        `Menampilkan ${visibleEntries.length} dari ${entries.length} aktivitas`;
    document.getElementById("historyTotalReports").textContent = String(reports.length);
    document.getElementById("historyTotalEvents").textContent = String(histories.length);
    document.getElementById("historyCompletedReports").textContent =
        String(reports.filter(report => report.status === "selesai").length);

    if (visibleEntries.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell(reports.length ? "Tidak ada aktivitas yang cocok dengan pencarian atau filter." : "Belum ada data laporan di browser ini.");
        cell.colSpan = 7;
        cell.className = "local-data-empty";
        row.append(cell);
        table.append(row);
        return;
    }

    visibleEntries.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.append(createCell(formatDateTime(entry.changedAt)));
        row.append(createCell(reportCode(entry.report)));
        row.append(createCell(reporterName(entry.report)));

        const transitionCell = document.createElement("td");
        transitionCell.append(createStatusTransition(entry));
        row.append(transitionCell);
        row.append(createCell(userName(entry.changedBy)));
        row.append(createCell(entry.notes || "—", "history-note-cell"));

        const detailCell = document.createElement("td");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-detail-button";
        button.textContent = "Detail";
        button.dataset.entryIndex = String(index);
        detailCell.append(button);
        row.append(detailCell);
        table.append(row);
    });
}

function addDetail(details, label, value) {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value || "—";
    details.append(term, description);
}

function openDetail(entry) {
    const report = entry.report;
    document.getElementById("historyModalTitle").textContent = report.title || "Detail Riwayat Laporan";
    document.getElementById("historyModalCode").textContent = reportCode(report);

    const details = document.getElementById("historyDetails");
    details.replaceChildren();
    addDetail(details, "Waktu perubahan", formatDateTime(entry.changedAt));
    addDetail(details, "Pelapor", reporterName(report));
    addDetail(details, "Kategori", reportCategory(report));
    addDetail(details, "Perubahan status", entry.oldStatus
        ? `${statusLabel(entry.oldStatus)} → ${statusLabel(entry.newStatus)}`
        : statusLabel(entry.newStatus));
    addDetail(details, "Diubah oleh", userName(entry.changedBy));
    addDetail(details, "Catatan", entry.notes);
    addDetail(details, "Tanggal kejadian", report.incidentDate || report.incident_date || report.date || "");
    addDetail(details, "Lokasi", report.incidentLocation || report.incident_location || report.location || "");
    addDetail(details, "Deskripsi", report.description || "");

    modal.hidden = false;
}

function closeModal() {
    modal.hidden = true;
}

document.getElementById("historySearch").addEventListener("input", render);
document.getElementById("historyStatus").addEventListener("change", render);
document.getElementById("resetHistoryFilters").addEventListener("click", () => {
    document.getElementById("historySearch").value = "";
    document.getElementById("historyStatus").value = "";
    render();
});
document.getElementById("closeHistoryModal").addEventListener("click", closeModal);
document.getElementById("dismissHistoryModal").addEventListener("click", closeModal);
modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
});
table.addEventListener("click", event => {
    const button = event.target.closest("button[data-entry-index]");
    if (!button) return;
    const entry = visibleEntries[Number(button.dataset.entryIndex)];
    if (entry) openDetail(entry);
});

render();

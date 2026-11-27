const STORAGE_KEYS = {
    users: "bullyingcare_admin_users",
    categories: "bullyingcare_admin_categories",
    reports: "sahabat_reports_demo_v1",
    handlings: "bullyingcare_case_handlings",
    handlingHistories: "bullyingcare_case_handling_histories",
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
const readCategories = () => readArray(STORAGE_KEYS.categories, "kategori");
const readReports = () => readArray(STORAGE_KEYS.reports, "laporan");
const readHandlings = () => readArray(STORAGE_KEYS.handlings, "penanganan kasus");
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
    const cell = makeCell(message, "guru-empty-cell");
    cell.colSpan = columns;
    row.append(cell);
    tableBody.append(row);
}

const users = readUsers();
const counselor = getActiveCounselor(users);
let reports = readReports();
let categories = readCategories();
let handlings = readHandlings();
let histories = readHistory();
const table = document.getElementById("handlingTable");
const modal = document.getElementById("handlingModal");
const form = document.getElementById("handlingForm");
let visibleHandlings = [];
const labels = {
    belum_ditangani: "Belum ditangani",
    sedang_ditangani: "Sedang ditangani",
    selesai: "Selesai"
};
function readHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.handlingHistories);
        if (stored === null) return [];
        const value = JSON.parse(stored);
        if (!Array.isArray(value)) throw new Error("Format riwayat penanganan tidak valid.");
        return value;
    } catch (error) {
        console.error("Gagal membaca riwayat penanganan:", error);
        return [];
    }
}
function reportFor(item) {
    return reports.find(report => String(report.id) === String(item.reportId ?? item.report_id));
}
function myHandlings() {
    return handlings.filter(item => counselor &&
        String(item.counselorId ?? item.counselor_id) === String(counselor.id));
}
function fillReports(select, selectedId = "") {
    select.replaceChildren();
    const placeholder = document.createElement("option"); placeholder.value = ""; placeholder.textContent = "Pilih laporan"; select.append(placeholder);
    reports.forEach(report => {
        const alreadyAssigned = handlings.some(item =>
            String(item.reportId ?? item.report_id) === String(report.id) &&
            String(item.id) !== String(document.getElementById("handlingId").value)
        );
        if (alreadyAssigned && String(report.id) !== String(selectedId)) return;
        const option = document.createElement("option");
        option.value = String(report.id);
        option.textContent = `${reportCode(report)} — ${reporterName(report, users)}`;
        select.append(option);
    });
    select.value = String(selectedId || "");
}
function render() {
    const search = document.getElementById("handlingSearch").value.trim().toLocaleLowerCase("id");
    const status = document.getElementById("handlingFilter").value;
    visibleHandlings = myHandlings().filter(item => {
        const report = reportFor(item);
        const query = report
            ? `${reportCode(report)} ${reporterName(report, users)} ${reportCategory(report, categories)} ${report.description || ""}`
            : item.reportCode || "";
        return query.toLocaleLowerCase("id").includes(search) &&
            (!status || item.handlingStatus === status);
    });
    table.replaceChildren();
    if (!visibleHandlings.length) showEmptyRow(table, "Belum ada laporan yang ditangani profil Guru BK ini.", 6);
    visibleHandlings.forEach((item, index) => {
        const report = reportFor(item);
        const row = document.createElement("tr");
        row.append(makeCell(report ? `${reportCode(report)} — ${reporterName(report, users)}` : item.reportCode || "Laporan tidak tersedia", "wrap-cell"));
        row.append(makeCell(report ? reportCategory(report, categories) : "—"));
        row.append(makeCell(formatDate(item.handlingDate ?? item.handling_date)));
        const statusCell = document.createElement("td");
        statusCell.append(makeStatusBadge(item.handlingStatus ?? item.handling_status, labels));
        row.append(statusCell);
        row.append(makeCell(item.followUp || "—", "wrap-cell"));
        const actions = document.createElement("td");
        const group = document.createElement("div");
        group.className = "guru-action-group";
        group.append(makeButton("Ubah", "edit", item.id));
        const edit = group.lastElementChild;
        edit.dataset.index = String(index);
        actions.append(group);
        row.append(actions);
        table.append(row);
    });
    document.getElementById("handlingSummary").textContent =
        `Menampilkan ${visibleHandlings.length} penanganan untuk ${counselor?.name || "Guru BK"}`;
}
function open(item = null) {
    form.reset();
    document.getElementById("handlingError").hidden = true;
    document.getElementById("handlingId").value = item ? String(item.id) : "";
    document.getElementById("handlingModalTitle").textContent = item ? "Ubah Penanganan" : "Tangani Laporan";
    fillReports(document.getElementById("handlingReport"), item?.reportId);
    document.getElementById("handlingDate").value = item?.handlingDate || item?.handling_date || new Date().toISOString().slice(0, 10);
    document.getElementById("handlingStatus").value = item?.handlingStatus || item?.handling_status || "belum_ditangani";
    document.getElementById("actionTaken").value = item?.actionTaken || item?.action_taken || "";
    document.getElementById("followUp").value = item?.followUp || item?.follow_up || "";
    document.getElementById("handlingNotes").value = "";
    if (!reports.length) {
        const error = document.getElementById("handlingError");
        error.textContent = "Belum ada laporan lokal. Data laporan harus tersedia sebelum penanganan dibuat.";
        error.hidden = false;
    }
    modal.hidden = false;
}
function close() { modal.hidden = true; form.reset(); }
function createHistory(item, oldStatus, newStatus, notes, now) {
    return [...histories, {
        id: `handling-history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        handlingId: item.id,
        reportId: item.reportId,
        changedBy: counselor?.id ?? null,
        oldStatus,
        newStatus,
        notes: notes || "",
        changedAt: now
    }];
}
document.getElementById("addHandling").addEventListener("click", () => open());
document.getElementById("closeHandling").addEventListener("click", close);
document.getElementById("cancelHandling").addEventListener("click", close);
document.getElementById("handlingSearch").addEventListener("input", render);
document.getElementById("handlingFilter").addEventListener("change", render);
document.getElementById("resetHandlingFilters").addEventListener("click", () => {
    document.getElementById("handlingSearch").value = "";
    document.getElementById("handlingFilter").value = "";
    render();
});
modal.addEventListener("click", event => { if (event.target === modal) close(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) close(); });
table.addEventListener("click", event => {
    const button = event.target.closest("button[data-action='edit']");
    if (!button) return;
    const item = visibleHandlings[Number(button.dataset.index)];
    if (item) open(item);
});
form.addEventListener("submit", event => {
    event.preventDefault();
    const error = document.getElementById("handlingError");
    error.hidden = true;
    if (!counselor) {
        error.textContent = "Buat/pilih profil Guru BK pada daftar Pengguna admin terlebih dahulu.";
        error.hidden = false;
        return;
    }
    const id = document.getElementById("handlingId").value;
    const existing = handlings.find(item => String(item.id) === id);
    const report = reports.find(item => String(item.id) === document.getElementById("handlingReport").value);
    if (!report) {
        error.textContent = "Pilih laporan yang valid.";
        error.hidden = false;
        return;
    }
    const conflict = handlings.some(item =>
        String(item.reportId ?? item.report_id) === String(report.id) &&
        String(item.id) !== String(existing?.id)
    );
    if (conflict) {
        error.textContent = "Laporan sudah memiliki penanganan. Ubah data penanganan yang sudah ada.";
        error.hidden = false;
        return;
    }
    const now = new Date().toISOString();
    const status = document.getElementById("handlingStatus").value;
    const item = {
        ...(existing || {}),
        id: existing?.id || handlings.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1,
        reportId: report.id,
        reportCode: reportCode(report),
        counselorId: counselor.id,
        handlingDate: document.getElementById("handlingDate").value || null,
        actionTaken: document.getElementById("actionTaken").value.trim(),
        followUp: document.getElementById("followUp").value.trim(),
        handlingStatus: status,
        createdAt: existing?.createdAt || now,
        updatedAt: now
    };
    const oldStatus = existing?.handlingStatus || null;
    const nextHistories = !existing || oldStatus !== status
        ? createHistory(item, oldStatus, status, document.getElementById("handlingNotes").value.trim() || (!existing ? "Kasus mulai ditangani." : ""), now)
        : histories;
    const previousHandlings = handlings;
    const previousHistories = histories;
    handlings = existing
        ? handlings.map(row => row.id === existing.id ? item : row)
        : [...handlings, item];
    histories = nextHistories;
    if (saveLocalArray(STORAGE_KEYS.handlings, handlings) &&
        saveLocalArray(STORAGE_KEYS.handlingHistories, histories)) {
        close();
        render();
    } else {
        handlings = previousHandlings;
        histories = previousHistories;
        saveLocalArray(STORAGE_KEYS.handlings, handlings);
        saveLocalArray(STORAGE_KEYS.handlingHistories, histories);
        error.textContent = "Penanganan/riwayat tidak dapat disimpan ke localStorage.";
        error.hidden = false;
    }
});
render();

const REPORT_KEY = "sahabat_reports_demo_v1";

function getDashboardReports() {
    try {
        return JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
    } catch {
        return [];
    }
}

function formatDashboardDate(date) {
    if (!date) return "—";

    return new Date(date + "T00:00:00")
        .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
}

function renderDashboard() {
    const reports = getDashboardReports();

    const count = status =>
        reports.filter(report => report.status === status).length;

    document.getElementById("statTotal").textContent =
        reports.length;

    document.getElementById("statWaiting").textContent =
        count("menunggu");

    document.getElementById("statProcess").textContent =
        reports.filter(report =>
            ["diverifikasi", "diproses", "pendampingan"]
                .includes(report.status)
        ).length;

    document.getElementById("statDone").textContent =
        count("selesai");

    const recent = [...reports]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 4);

    const statusNames = {
        menunggu: "Menunggu",
        diverifikasi: "Diverifikasi",
        diproses: "Diproses",
        pendampingan: "Pendampingan",
        selesai: "Selesai",
        ditolak: "Ditolak"
    };

    document.getElementById("latestReports").innerHTML =
        recent.length
            ? recent.map(report => `
                <div class="latest-row">

                    <span class="latest-symbol">▤</span>

                    <div class="latest-info">
                        <strong>${escapeHTML(report.title)}</strong>
                        <small>
                            ${escapeHTML(report.category)}
                            · ${formatDashboardDate(report.date)}
                        </small>
                    </div>

                    <span class="status-badge status-${report.status === "pendampingan" ? "diproses" : report.status}">
                        ${statusNames[report.status] || "Menunggu"}
                    </span>

                </div>
            `).join("")
            : `<div class="empty-state">
                Belum ada laporan yang dibuat.
              </div>`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

renderDashboard();
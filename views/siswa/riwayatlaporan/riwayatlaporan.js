const REPORT_KEY = "sahabat_reports_demo_v1";

function getHistoryReports() {
    try {
        return JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
    } catch {
        return [];
    }
}

function escapeHistory(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function historyDate(date) {
    if (!date) return "—";

    return new Date(date + "T00:00:00")
        .toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
}

function renderHistory() {
    const reports = getHistoryReports();

    const keyword = document
        .getElementById("historySearch")
        .value.toLowerCase();

    const filtered = [...reports]
        .sort((a, b) => b.createdAt - a.createdAt)
        .filter(report =>
            `${report.title} ${report.category}`
                .toLowerCase()
                .includes(keyword)
        );

    const statusNames = {
        menunggu: "Menunggu",
        diverifikasi: "Diverifikasi",
        diproses: "Diproses",
        pendampingan: "Pendampingan",
        selesai: "Selesai",
        ditolak: "Ditolak"
    };

    const rows = document.getElementById("historyRows");

    rows.innerHTML = filtered.map(report => `
        <tr>
            <td>${escapeHistory(report.title)}</td>
            <td>${escapeHistory(report.category)}</td>
            <td>${historyDate(report.date)}</td>

            <td>
                <span class="status-badge status-${report.status === "pendampingan" ? "diproses" : report.status}">
                    ${statusNames[report.status] || "Menunggu"}
                </span>
            </td>

            <td>
                <button class="detail-button"
                    data-detail="${escapeHistory(report.id)}">
                    Detail
                </button>
            </td>
        </tr>
    `).join("");

    document.getElementById("historyCount").textContent =
        `${reports.length} laporan tercatat`;

    document.getElementById("historyEmpty").style.display =
        filtered.length ? "none" : "block";

    rows.querySelectorAll("[data-detail]").forEach(button => {
        button.addEventListener("click", () => {
            const report = reports.find(r => r.id === button.dataset.detail);

            if (!report) return;

            document.getElementById("modalTitle").textContent =
                report.title;

            document.getElementById("modalText").textContent =
                `Kategori: ${report.category}

Tanggal: ${historyDate(report.date)}

Lokasi: ${report.location || "Tidak diisi"}

Kronologi: ${report.description}

Bukti: ${report.evidence || "Tidak ada"}

Identitas disamarkan: ${report.anonymous ? "Ya" : "Tidak"}

Status: ${statusNames[report.status] || "Menunggu"}`;

            document.getElementById("appModal").classList.add("show");
        });
    });
}

document.getElementById("historySearch")
    .addEventListener("input", renderHistory);

document.querySelectorAll("[data-modal-close]").forEach(button => {
    button.addEventListener("click", () => {
        document.getElementById("appModal").classList.remove("show");
    });
});

document.getElementById("appModal").addEventListener("click", event => {
    if (event.target.id === "appModal") {
        event.currentTarget.classList.remove("show");
    }
});

renderHistory();
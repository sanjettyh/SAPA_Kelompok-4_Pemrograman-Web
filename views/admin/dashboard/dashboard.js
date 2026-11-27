const reports = [
    {
        id: "LPR001",
        reporter: "Orang Tua A",
        category: "Verbal",
        date: "2026-11-05",
        status: "Menunggu"
    },
    {
        id: "LPR002",
        reporter: "Orang Tua B",
        category: "Fisik",
        date: "2026-11-04",
        status: "Diproses"
    },
    {
        id: "LPR003",
        reporter: "Orang Tua C",
        category: "Sosial",
        date: "2026-11-03",
        status: "Selesai"
    },
    {
        id: "LPR004",
        reporter: "Orang Tua D",
        category: "Verbal",
        date: "2026-11-02",
        status: "Ditolak"
    }
];

function renderReports(data) {
    const table = document.getElementById("reportTable");

    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center">
                    Tidak ada laporan ditemukan.
                </td>
            </tr>
        `;
        return;
    }

    data.forEach((report, index) => {
        let statusClass = "status-pending";

        if (report.status === "Diproses") {
            statusClass = "status-processing";
        }

        if (report.status === "Selesai") {
            statusClass = "status-completed";
        }

        table.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${report.id}</td>
                <td>${report.reporter}</td>
                <td>${report.category}</td>
                <td>${report.date}</td>
                <td>
                    <span class="status ${statusClass}">
                        ${report.status}
                    </span>
                </td>
            </tr>
        `;
    });
}

function filterReports() {
    const date = document.getElementById("filterDate").value;
    const status = document.getElementById("filterStatus").value;

    const filtered = reports.filter(report => {
        const matchDate = !date || report.date === date;
        const matchStatus = !status || report.status === status;

        return matchDate && matchStatus;
    });

    renderReports(filtered);
}

function resetFilter() {
    document.getElementById("filterDate").value = "";
    document.getElementById("filterStatus").value = "";

    renderReports(reports);
}

document.getElementById("filterDate")
    .addEventListener("change", filterReports);

document.getElementById("filterStatus")
    .addEventListener("change", filterReports);

renderReports(reports);
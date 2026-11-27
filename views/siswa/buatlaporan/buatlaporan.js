const REPORT_KEY = "sahabat_reports_demo_v1";

document.getElementById("reportForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const title = document.getElementById("reportTitle").value.trim();
    const description = document.getElementById("reportDescription").value.trim();

    if (!title || !description) {
        showToast("Lengkapi formulir terlebih dahulu.");
        return;
    }

    const file = document.getElementById("reportEvidence").files[0];

    let reports = [];

    try {
        reports = JSON.parse(localStorage.getItem(REPORT_KEY) || "[]");
    } catch {
        reports = [];
    }

    const newReport = {
        id: Date.now().toString(),
        title,
        category: document.getElementById("reportCategory").value,
        date: document.getElementById("incidentDate").value,
        location: document.getElementById("incidentLocation").value.trim(),
        description,
        evidence: file ? file.name : "",
        anonymous: document.getElementById("anonymousReport").checked,
        status: "menunggu",
        createdAt: Date.now()
    };

    reports.push(newReport);

    localStorage.setItem(REPORT_KEY, JSON.stringify(reports));

    this.reset();

    showToast("Laporan demo berhasil disimpan.");

    setTimeout(() => {
        window.location.href = "../riwayatlaporan/index.html";
    }, 900);

});
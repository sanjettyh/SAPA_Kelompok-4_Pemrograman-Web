const routes = {
    dashboard: "dashboard/index.html",
    laporan: "laporan/index.html",
    penanganan: "penanganankasus/index.html",
    konseling: "jadwalkonseling/index.html",
    riwayat: "riwayatpenanganan/index.html",
    edukasi: "edukasi/index.html",
    profile: "profile/index.html"
};

export async function renderSidebar(activePage, depth = 0) {
    const response = await fetch(new URL("./sidebar.html", import.meta.url));
    if (!response.ok) throw new Error("Komponen sidebar Guru BK gagal dimuat.");

    const template = document.createElement("template");
    template.innerHTML = await response.text();
    const prefix = "../".repeat(depth);

    template.content.querySelector("[data-home-link]").href = `${prefix}index.html`;
    template.content.querySelectorAll("[data-route]").forEach(link => {
        const route = link.dataset.route;
        link.href = `${prefix}${routes[route]}`;

        if (route === activePage) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
    });

    return template.innerHTML;
}

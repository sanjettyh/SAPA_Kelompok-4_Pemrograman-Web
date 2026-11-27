const routes = {
    dashboard: "dashboard",
    pengguna: "pengguna",
    kategori: "kategori",
    laporan: "laporan",
    riwayatlaporan: "riwayatlaporan",
    penanganankasus: "penanganankasus",
    jadwalkonseling: "jadwalkonseling",
    edukasi: "edukasi",
    profile: "profile"
};
const activePageAliases = {
    riwayatlaporan: ["riwayat"],
    penanganankasus: ["penanganan"],
    jadwalkonseling: ["konseling"]
};

document.addEventListener("click", event => {
    if (!event.target.closest("[data-admin-logout]")) return;
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;

    localStorage.removeItem("bullyingcare_auth_session");
    window.location.href = "../../auth/index.html";
});

export function renderSidebar(activePage) {
    return fetch(new URL("./sidebar.html", import.meta.url))
        .then(response => {
            if (!response.ok) throw new Error("Komponen sidebar admin gagal dimuat.");
            return response.text();
        })
        .then(markup => {
            const template = document.createElement("template");
            template.innerHTML = markup;
            template.content.querySelectorAll("[data-route]").forEach(link => {
                const route = link.dataset.route;
                link.href = `../${routes[route]}/index.html`;

                if (route === activePage || activePageAliases[route]?.includes(activePage)) {
                    link.classList.add("active");
                    link.setAttribute("aria-current", "page");
                }
            });
            return template.innerHTML;
        });
}
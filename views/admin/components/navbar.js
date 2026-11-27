export function renderNavbar(title) {
    return fetch(new URL("./navbar.html", import.meta.url))
        .then(response => {
            if (!response.ok) throw new Error("Komponen navbar admin gagal dimuat.");
            return response.text();
        })
        .then(markup => {
            const template = document.createElement("template");
            template.innerHTML = markup;
            template.content.querySelector("[data-navbar-title]").textContent = title;
            template.content.querySelector("[data-navbar-date]").textContent =
                new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }).format(new Date());
            return template.innerHTML;
        });
}
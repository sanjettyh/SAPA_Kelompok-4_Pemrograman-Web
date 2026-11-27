export async function renderNavbar(title) {
    const response = await fetch(new URL("./navbar.html", import.meta.url));
    if (!response.ok) throw new Error("Komponen navbar Guru BK gagal dimuat.");

    const template = document.createElement("template");
    template.innerHTML = await response.text();
    template.content.querySelector("#guruPageTitle").textContent = title;

    return template.innerHTML;
}

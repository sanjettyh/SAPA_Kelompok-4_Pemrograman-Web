async function loadFooter() {
    const mount = document.getElementById("footerMount");
    if (!mount) return;

    try {
        const root = document.body.dataset.root || ".";
        const response = await fetch(`${root}/components/footer.html`);
        if (!response.ok) throw new Error("Footer gagal dimuat");

        mount.innerHTML = await response.text();
    } catch (error) {
        console.error("Footer gagal dimuat.", error);
        mount.innerHTML = `
            <div class="component-error">
                Footer gagal dimuat. Jalankan dengan Live Server.
            </div>
        `;
    }
}

loadFooter();

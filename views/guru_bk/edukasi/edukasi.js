function readEducation() {
    try {
        const stored = localStorage.getItem("bullyingcare_educational_contents");
        if (stored === null) return [];
        const contents = JSON.parse(stored);
        if (!Array.isArray(contents)) throw new Error("Format konten edukasi tidak valid.");
        return contents;
    } catch (error) {
        console.error("Gagal membaca konten edukasi dari localStorage:", error);
        return [];
    }
}
function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric", month: "short", year: "numeric"
    }).format(date);
}

const grid = document.getElementById("educationGrid");
const contents = readEducation().filter(content => content.status === "published")
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0));
function safeUrl(value) {
    if (!value) return "";
    try {
        const url = new URL(value, window.location.href);
        return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}
function showContent(content) {
    document.getElementById("educationModalTitle").textContent = content.title || "Materi Edukasi";
    document.getElementById("educationMeta").textContent =
        `${content.contentType || "artikel"} · Diterbitkan ${formatDate(content.publishedAt)}`;
    document.getElementById("educationContent").textContent = content.content || "Materi edukasi.";
    document.getElementById("educationModal").hidden = false;
}
function renderCard(content) {
    const card = document.createElement("article");
    card.className = "guru-content-card";
    const art = document.createElement("div");
    art.className = "guru-content-art";
    const imageUrl = safeUrl(content.thumbnail || (content.contentType === "poster" ? content.mediaUrl : ""));
    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = `Materi ${content.title}`;
        image.loading = "lazy";
        art.append(image);
    } else {
        art.textContent = content.contentType === "video" ? "▶" : content.contentType === "poster" ? "▧" : "📘";
    }
    const copy = document.createElement("div");
    copy.className = "guru-content-copy";
    const type = document.createElement("span");
    type.textContent = content.contentType || "artikel";
    const title = document.createElement("h3");
    title.textContent = content.title;
    const preview = document.createElement("p");
    preview.textContent = content.content || "Konten edukasi anti-bullying.";
    const action = document.createElement(content.contentType === "video" ? "a" : "button");
    action.className = "guru-action-button";
    if (content.contentType === "video") {
        const url = safeUrl(content.mediaUrl);
        action.textContent = "Tonton video";
        if (url) {
            action.href = url;
            action.target = "_blank";
            action.rel = "noopener noreferrer";
        } else {
            action.setAttribute("aria-disabled", "true");
        }
    } else {
        action.type = "button";
        action.textContent = content.contentType === "poster" ? "Lihat poster" : "Baca artikel";
        action.addEventListener("click", () => showContent(content));
    }
    copy.append(type, title, preview, action);
    card.append(art, copy);
    return card;
}
contents.forEach(content => grid.append(renderCard(content)));
document.getElementById("educationEmpty").hidden = contents.length > 0;
const modal = document.getElementById("educationModal");
function close() { modal.hidden = true; }
document.getElementById("closeEducation").addEventListener("click", close);
document.getElementById("dismissEducation").addEventListener("click", close);
modal.addEventListener("click", event => { if (event.target === modal) close(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) close(); });

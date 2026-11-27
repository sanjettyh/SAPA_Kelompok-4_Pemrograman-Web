const EDUCATIONAL_CONTENT_KEY = "bullyingcare_educational_contents";
const DEFAULT_PUBLISHED_CONTENTS = [
    {
        id: 1,
        title: "Mengenal Bullying dan Bentuk-bentuknya",
        slug: "mengenal-bullying-dan-bentuk-bentuknya",
        content: "Bullying adalah perilaku agresif yang dilakukan berulang dan melibatkan ketidakseimbangan kekuatan. Bentuknya dapat berupa verbal, fisik, sosial, maupun siber. Jika melihat atau mengalaminya, cari bantuan orang dewasa tepercaya.",
        contentType: "artikel",
        mediaUrl: "",
        thumbnail: "",
        status: "published",
        publishedAt: "2026-10-01T08:00:00.000Z"
    },
    {
        id: 2,
        title: "Menjadi Teman yang Mendukung",
        slug: "menjadi-teman-yang-mendukung",
        content: "Dengarkan teman tanpa menghakimi, yakinkan bahwa ia tidak sendirian, jangan ikut menyebarkan konten yang mempermalukan, dan bantu hubungkan dengan guru BK atau orang dewasa tepercaya.",
        contentType: "artikel",
        mediaUrl: "",
        thumbnail: "",
        status: "published",
        publishedAt: "2026-10-02T08:00:00.000Z"
    },
    {
        id: 3,
        title: "Aman dan Bijak di Dunia Digital",
        slug: "aman-dan-bijak-di-dunia-digital",
        content: "Jaga informasi pribadi, simpan bukti jika menerima pesan mengganggu, blokir dan laporkan akun pelaku, serta jangan membalas dengan ancaman. Minta bantuan orang dewasa jika situasi berlanjut.",
        contentType: "artikel",
        mediaUrl: "",
        thumbnail: "",
        status: "published",
        publishedAt: "2026-10-03T08:00:00.000Z"
    }
];

function getPublishedContents() {
    try {
        const stored = localStorage.getItem(EDUCATIONAL_CONTENT_KEY);
        if (stored === null) {
            localStorage.setItem(EDUCATIONAL_CONTENT_KEY, JSON.stringify(DEFAULT_PUBLISHED_CONTENTS));
            return DEFAULT_PUBLISHED_CONTENTS;
        }

        const contents = JSON.parse(stored);
        if (!Array.isArray(contents)) {
            throw new Error("Format konten edukasi tidak valid.");
        }
        return contents.filter(content => content.status === "published");
    } catch (error) {
        console.error("Konten edukasi lokal gagal dimuat:", error);
        return [];
    }
}

function safeMediaUrl(value) {
    if (!value) return "";
    try {
        const url = new URL(value, window.location.href);
        if (!["http:", "https:"].includes(url.protocol)) return "";
        return url.href;
    } catch {
        return "";
    }
}

function createPublishedCard(content) {
    const typeLabels = { artikel: "ARTIKEL", video: "VIDEO", poster: "POSTER" };
    const icons = { artikel: "📘", video: "▶", poster: "🖼" };
    const card = document.createElement("article");
    card.className = "education-card published-education-card";

    const art = document.createElement("div");
    art.className = "education-art published-education-art";
    const imageUrl = safeMediaUrl(content.thumbnail || (content.contentType === "poster" ? content.mediaUrl : ""));
    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = `Materi ${content.title}`;
        image.loading = "lazy";
        art.append(image);
    } else {
        art.textContent = icons[content.contentType] || "📘";
    }

    const copy = document.createElement("div");
    copy.className = "education-copy";
    const eyebrow = document.createElement("span");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = typeLabels[content.contentType] || "EDUKASI";

    const title = document.createElement("h3");
    title.textContent = content.title;
    const excerpt = document.createElement("p");
    excerpt.textContent = content.content || "Materi edukasi anti-bullying.";
    copy.append(eyebrow, title, excerpt);

    if (content.contentType === "video") {
        const mediaUrl = safeMediaUrl(content.mediaUrl);
        const link = document.createElement("a");
        link.className = "text-link published-education-link";
        link.textContent = "Tonton video →";
        if (mediaUrl) {
            link.href = mediaUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        } else {
            link.setAttribute("aria-disabled", "true");
        }
        copy.append(link);
    } else {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "text-link education-read";
        button.dataset.title = content.title || "";
        button.dataset.content = content.content || "Materi edukasi anti-bullying.";
        button.textContent = content.contentType === "poster" ? "Lihat materi →" : "Baca selengkapnya →";
        copy.append(button);
    }

    card.append(art, copy);
    return card;
}

function renderPublishedContents() {
    const grid = document.querySelector(".education-grid");
    if (!grid) return;

    getPublishedContents()
        .sort((a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0))
        .forEach(content => grid.append(createPublishedCard(content)));
}

document.querySelector(".education-grid").addEventListener("click", event => {
    const button = event.target.closest(".education-read");
    if (!button) return;

    document.getElementById("modalTitle").textContent = button.dataset.title || "";
    document.getElementById("modalText").textContent = button.dataset.content || "";
    document.getElementById("appModal").classList.add("show");
});

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

renderPublishedContents();

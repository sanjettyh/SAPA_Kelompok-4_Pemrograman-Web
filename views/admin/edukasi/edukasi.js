const STORAGE_KEY = "bullyingcare_educational_contents";
const USER_STORAGE_KEY = "bullyingcare_admin_users";
const CONTENT_TYPES = {
    artikel: "Artikel",
    video: "Video",
    poster: "Poster"
};
const SEED_CONTENTS = [
    {
        id: 1,
        authorId: null,
        authorName: "Administrator",
        title: "Mengenal Bullying dan Bentuk-bentuknya",
        slug: "mengenal-bullying-dan-bentuk-bentuknya",
        content: "Bullying adalah perilaku agresif yang dilakukan berulang dan melibatkan ketidakseimbangan kekuatan. Bentuknya dapat berupa verbal, fisik, sosial, maupun siber. Jika melihat atau mengalaminya, cari bantuan orang dewasa tepercaya.",
        contentType: "artikel",
        mediaUrl: "",
        thumbnail: "",
        status: "published",
        publishedAt: "2026-10-01T08:00:00.000Z",
        createdAt: "2026-10-01T08:00:00.000Z",
        updatedAt: "2026-10-01T08:00:00.000Z"
    },
    {
        id: 2,
        authorId: null,
        authorName: "Administrator",
        title: "Menjadi Teman yang Mendukung",
        slug: "menjadi-teman-yang-mendukung",
        content: "Dengarkan teman tanpa menghakimi, yakinkan bahwa ia tidak sendirian, jangan ikut menyebarkan konten yang mempermalukan, dan bantu hubungkan dengan guru BK atau orang dewasa tepercaya.",
        contentType: "artikel",
        mediaUrl: "",
        thumbnail: "",
        status: "published",
        publishedAt: "2026-10-02T08:00:00.000Z",
        createdAt: "2026-10-02T08:00:00.000Z",
        updatedAt: "2026-10-02T08:00:00.000Z"
    },
    {
        id: 3,
        authorId: null,
        authorName: "Administrator",
        title: "Tips Aman di Dunia Digital",
        slug: "tips-aman-di-dunia-digital",
        content: "Jaga informasi pribadi, simpan bukti jika menerima pesan mengganggu, blokir dan laporkan akun pelaku, serta jangan membalas dengan ancaman. Minta bantuan orang dewasa jika situasi berlanjut.",
        contentType: "artikel",
        mediaUrl: "",
        thumbnail: "",
        status: "draft",
        publishedAt: null,
        createdAt: "2026-10-03T08:00:00.000Z",
        updatedAt: "2026-10-03T08:00:00.000Z"
    }
];

const contentTable = document.getElementById("contentTable");
const contentModal = document.getElementById("contentModal");
const contentForm = document.getElementById("contentForm");
const formError = document.getElementById("contentFormError");
let contents = loadContents();
let users = loadUsers();

function loadContents() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CONTENTS));
            return SEED_CONTENTS.map(content => ({ ...content }));
        }

        const value = JSON.parse(stored);
        if (!Array.isArray(value)) throw new Error("Format data konten edukasi tidak valid.");
        return value;
    } catch (error) {
        alert(`Data konten edukasi tidak dapat dibaca: ${error.message}`);
        return [];
    }
}

function loadUsers() {
    try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored === null) return [];
        const value = JSON.parse(stored);
        if (!Array.isArray(value)) throw new Error("Format data pengguna tidak valid.");
        return value;
    } catch (error) {
        alert(`Data pengguna tidak dapat dibaca: ${error.message}`);
        return [];
    }
}

function saveContents() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contents));
        return true;
    } catch {
        return false;
    }
}

function makeSlug(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("id")
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 220);
}

function uniqueSlug(value, currentId = "") {
    const baseSlug = makeSlug(value) || "konten-edukasi";
    let slug = baseSlug;
    let suffix = 2;
    while (contents.some(content =>
        content.slug.toLocaleLowerCase("id") === slug.toLocaleLowerCase("id") &&
        String(content.id) !== String(currentId)
    )) {
        const suffixText = `-${suffix}`;
        slug = `${baseSlug.slice(0, 220 - suffixText.length)}${suffixText}`;
        suffix += 1;
    }
    return slug;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

function createActionButton(label, action, content) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `education-action-button${action === "delete" ? " delete" : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = String(content.id);
    button.setAttribute("aria-label", `${label} ${content.title}`);
    return button;
}

function authorName(content) {
    const author = users.find(user => String(user.id) === String(content.authorId));
    return author?.name || content.authorName || "Administrator";
}

function renderContents() {
    const searchTerm = document.getElementById("searchContents").value.trim().toLocaleLowerCase("id");
    const typeFilter = document.getElementById("filterType").value;
    const statusFilter = document.getElementById("filterStatus").value;
    const filtered = contents.filter(content => {
        const searchable = `${content.title} ${content.slug} ${content.content || ""}`.toLocaleLowerCase("id");
        return searchable.includes(searchTerm) &&
            (!typeFilter || content.contentType === typeFilter) &&
            (!statusFilter || content.status === statusFilter);
    });

    contentTable.replaceChildren();
    document.getElementById("contentCount").textContent = `${contents.length} konten`;
    document.getElementById("contentSummary").textContent =
        `Menampilkan ${filtered.length} dari ${contents.length} konten`;

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("Tidak ada konten yang cocok dengan pencarian atau filter.");
        cell.colSpan = 6;
        cell.className = "education-empty-row";
        row.append(cell);
        contentTable.append(row);
    } else {
        filtered.forEach(content => {
            const row = document.createElement("tr");
            const titleCell = document.createElement("td");
            titleCell.className = "education-content-title";
            const title = document.createElement("strong");
            title.textContent = content.title;
            const slug = document.createElement("small");
            slug.textContent = `/${content.slug}`;
            titleCell.append(title, slug);
            row.append(titleCell);
            row.append(createCell(CONTENT_TYPES[content.contentType] || content.contentType));
            row.append(createCell(authorName(content)));

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = `education-badge status-${content.status}`;
            badge.textContent = content.status === "published" ? "Published" : "Draft";
            statusCell.append(badge);
            row.append(statusCell);
            row.append(createCell(formatDate(content.updatedAt || content.createdAt)));

            const actionCell = document.createElement("td");
            const actionGroup = document.createElement("div");
            actionGroup.className = "education-action-group";
            actionGroup.append(createActionButton("Ubah", "edit", content));
            actionGroup.append(createActionButton("Hapus", "delete", content));
            actionCell.append(actionGroup);
            row.append(actionCell);
            contentTable.append(row);
        });
    }

    document.getElementById("totalContents").textContent = String(contents.length);
    document.getElementById("publishedContents").textContent =
        String(contents.filter(content => content.status === "published").length);
    document.getElementById("draftContents").textContent =
        String(contents.filter(content => content.status === "draft").length);
    document.getElementById("articleContents").textContent =
        String(contents.filter(content => content.contentType === "artikel").length);
}

function populateAuthors(selectedId = "") {
    const select = document.getElementById("contentAuthor");
    select.replaceChildren();
    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "Administrator / Tidak ditentukan";
    select.append(noneOption);

    users.forEach(user => {
        const option = document.createElement("option");
        option.value = String(user.id);
        option.textContent = `${user.name} (${user.email})`;
        select.append(option);
    });
    select.value = String(selectedId || "");
}

function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
}

function openContentModal(content = null) {
    contentForm.reset();
    document.getElementById("contentSlug").dataset.edited = "";
    formError.textContent = "";
    formError.hidden = true;
    document.getElementById("contentId").value = content ? String(content.id) : "";
    document.getElementById("contentModalTitle").textContent =
        content ? "Ubah Konten" : "Tambah Konten";
    populateAuthors(content?.authorId);

    if (content) {
        document.getElementById("contentTitle").value = content.title;
        document.getElementById("contentSlug").value = content.slug;
        document.getElementById("contentType").value = content.contentType;
        document.getElementById("contentStatus").value = content.status;
        document.getElementById("contentBody").value = content.content || "";
        document.getElementById("contentMediaUrl").value = content.mediaUrl || "";
        document.getElementById("contentThumbnail").value = content.thumbnail || "";
    } else {
        document.getElementById("contentSlug").value = "";
        document.getElementById("contentStatus").value = "draft";
    }

    contentModal.hidden = false;
    document.getElementById("contentTitle").focus();
}

function closeContentModal() {
    contentModal.hidden = true;
    contentForm.reset();
}

document.getElementById("addContentButton").addEventListener("click", () => openContentModal());
document.getElementById("closeContentModal").addEventListener("click", closeContentModal);
document.getElementById("cancelContent").addEventListener("click", closeContentModal);

document.getElementById("contentTitle").addEventListener("input", event => {
    const slugInput = document.getElementById("contentSlug");
    if (!slugInput.dataset.edited) slugInput.value = makeSlug(event.target.value);
});

document.getElementById("contentSlug").addEventListener("input", event => {
    event.target.dataset.edited = "true";
    event.target.value = makeSlug(event.target.value);
});

contentModal.addEventListener("click", event => {
    if (event.target === contentModal) closeContentModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !contentModal.hidden) closeContentModal();
});

["searchContents", "filterType", "filterStatus"].forEach(id => {
    document.getElementById(id).addEventListener(
        id === "searchContents" ? "input" : "change",
        renderContents
    );
});

document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchContents").value = "";
    document.getElementById("filterType").value = "";
    document.getElementById("filterStatus").value = "";
    renderContents();
});

contentTable.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const content = contents.find(item => String(item.id) === button.dataset.id);
    if (!content) return;

    if (button.dataset.action === "edit") {
        openContentModal(content);
        return;
    }

    if (button.dataset.action === "delete" && confirm(`Hapus konten "${content.title}"?`)) {
        const previousContents = contents;
        contents = contents.filter(item => item.id !== content.id);
        if (saveContents()) {
            renderContents();
        } else {
            contents = previousContents;
            alert("Konten gagal dihapus karena browser tidak dapat menyimpan perubahan.");
        }
    }
});

contentForm.addEventListener("submit", event => {
    event.preventDefault();
    formError.hidden = true;

    const idValue = document.getElementById("contentId").value;
    const existing = contents.find(content => String(content.id) === idValue);
    const title = document.getElementById("contentTitle").value.trim();
    const slugValue = makeSlug(document.getElementById("contentSlug").value);
    const slug = uniqueSlug(slugValue, existing?.id);
    const type = document.getElementById("contentType").value;
    const status = document.getElementById("contentStatus").value;
    const mediaUrl = document.getElementById("contentMediaUrl").value.trim();
    const thumbnail = document.getElementById("contentThumbnail").value.trim();
    const authorIdValue = document.getElementById("contentAuthor").value;
    const author = users.find(user => String(user.id) === authorIdValue);

    if (!slug) {
        showFormError("Slug wajib diisi dengan huruf, angka, atau tanda hubung.");
        return;
    }

    if (type !== "artikel" && !mediaUrl) {
        showFormError("URL media wajib diisi untuk konten video dan poster.");
        return;
    }

    const now = new Date().toISOString();
    const content = {
        ...(existing || {}),
        id: existing?.id || contents.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1,
        authorId: author ? author.id : null,
        authorName: author?.name || (existing?.authorId ? existing.authorName : "Administrator"),
        title,
        slug,
        content: document.getElementById("contentBody").value.trim(),
        contentType: type,
        mediaUrl,
        thumbnail,
        status,
        publishedAt: status === "published"
            ? existing?.publishedAt || now
            : null,
        createdAt: existing?.createdAt || now,
        updatedAt: now
    };

    const previousContents = contents;
    contents = existing
        ? contents.map(item => item.id === existing.id ? content : item)
        : [...contents, content];

    if (saveContents()) {
        closeContentModal();
        renderContents();
    } else {
        contents = previousContents;
        showFormError("Konten gagal disimpan karena browser tidak dapat menyimpan perubahan.");
    }
});

renderContents();

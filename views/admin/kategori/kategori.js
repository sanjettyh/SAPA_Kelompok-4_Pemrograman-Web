const STORAGE_KEY = "bullyingcare_admin_categories";
const SEED_CATEGORIES = [
    {
        id: 1,
        name: "Bullying Fisik",
        description: "Tindakan menyakiti atau mengancam secara fisik, seperti memukul, mendorong, atau merusak barang.",
        createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
        id: 2,
        name: "Bullying Verbal",
        description: "Perkataan yang menghina, mengejek, mengancam, atau merendahkan seseorang.",
        createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
        id: 3,
        name: "Bullying Sosial",
        description: "Tindakan mengucilkan, menyebarkan rumor, atau merusak hubungan sosial seseorang.",
        createdAt: "2026-10-01T08:00:00.000Z"
    },
    {
        id: 4,
        name: "Cyberbullying",
        description: "Perundungan melalui media digital, seperti pesan, media sosial, atau platform daring lainnya.",
        createdAt: "2026-10-01T08:00:00.000Z"
    }
];

const categoryTable = document.getElementById("categoryTable");
const categoryModal = document.getElementById("categoryModal");
const categoryForm = document.getElementById("categoryForm");
const categoryFormError = document.getElementById("categoryFormError");
let categories = loadCategories();

function loadCategories() {
    try {
        const savedCategories = localStorage.getItem(STORAGE_KEY);

        if (savedCategories === null) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CATEGORIES));
            return SEED_CATEGORIES.map(category => ({ ...category }));
        }

        const parsedCategories = JSON.parse(savedCategories);
        if (!Array.isArray(parsedCategories)) {
            throw new Error("Format data kategori di browser tidak valid.");
        }
        return parsedCategories;
    } catch (error) {
        alert(`Data kategori tidak dapat dibaca: ${error.message}`);
        return [];
    }
}

function saveCategories() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
        return true;
    } catch {
        return false;
    }
}

function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value;
    if (className) cell.className = className;
    return cell;
}

function createActionButton(label, action, id, isDelete = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-action-button${isDelete ? " delete" : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = String(id);
    button.setAttribute("aria-label", `${label} kategori`);
    return button;
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

function renderCategories() {
    const searchTerm = document.getElementById("searchCategories").value.trim().toLocaleLowerCase("id");
    const filteredCategories = categories.filter(category =>
        `${category.name} ${category.description || ""}`.toLocaleLowerCase("id").includes(searchTerm)
    );

    categoryTable.replaceChildren();
    document.getElementById("categoryCount").textContent = `${categories.length} kategori`;
    document.getElementById("categorySummary").textContent =
        `Menampilkan ${filteredCategories.length} dari ${categories.length} kategori`;

    if (filteredCategories.length === 0) {
        const row = document.createElement("tr");
        const cell = createCell("Tidak ada kategori yang cocok dengan pencarian.");
        cell.colSpan = 5;
        cell.className = "category-empty-row";
        row.append(cell);
        categoryTable.append(row);
        return;
    }

    filteredCategories.forEach((category, index) => {
        const row = document.createElement("tr");
        row.append(createCell(String(index + 1)));
        row.append(createCell(category.name));
        row.append(createCell(category.description || "—", "category-description-cell"));
        row.append(createCell(formatDate(category.createdAt)));

        const actionsCell = document.createElement("td");
        const actionGroup = document.createElement("div");
        actionGroup.className = "category-action-group";
        actionGroup.append(createActionButton("Ubah", "edit", category.id));
        actionGroup.append(createActionButton("Hapus", "delete", category.id, true));
        actionsCell.append(actionGroup);
        row.append(actionsCell);
        categoryTable.append(row);
    });
}

function showFormError(message) {
    categoryFormError.textContent = message;
    categoryFormError.hidden = false;
}

function openCategoryModal(category = null) {
    categoryForm.reset();
    categoryFormError.textContent = "";
    categoryFormError.hidden = true;
    document.getElementById("categoryId").value = category ? String(category.id) : "";
    document.getElementById("categoryModalTitle").textContent =
        category ? "Ubah Kategori" : "Tambah Kategori";

    if (category) {
        document.getElementById("categoryName").value = category.name;
        document.getElementById("categoryDescription").value = category.description || "";
    }

    categoryModal.hidden = false;
    document.getElementById("categoryName").focus();
}

function closeCategoryModal() {
    categoryModal.hidden = true;
    categoryForm.reset();
}

document.getElementById("addCategoryButton").addEventListener("click", () => openCategoryModal());
document.getElementById("closeCategoryModal").addEventListener("click", closeCategoryModal);
document.getElementById("cancelCategory").addEventListener("click", closeCategoryModal);
document.getElementById("searchCategories").addEventListener("input", renderCategories);

document.getElementById("resetSearch").addEventListener("click", () => {
    document.getElementById("searchCategories").value = "";
    renderCategories();
});

categoryModal.addEventListener("click", event => {
    if (event.target === categoryModal) closeCategoryModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !categoryModal.hidden) closeCategoryModal();
});

categoryTable.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const category = categories.find(item => String(item.id) === button.dataset.id);
    if (!category) return;

    if (button.dataset.action === "edit") {
        openCategoryModal(category);
        return;
    }

    if (button.dataset.action === "delete" && confirm(`Hapus kategori "${category.name}"?`)) {
        let reports;
        try {
            reports = JSON.parse(localStorage.getItem("sahabat_reports_demo_v1") || "[]");
            if (!Array.isArray(reports)) throw new Error("Format data laporan tidak valid.");
        } catch (error) {
            alert(`Kategori tidak dapat dihapus karena data laporan gagal dibaca: ${error.message}`);
            return;
        }

        const normalizeName = value => String(value || "")
            .toLocaleLowerCase("id")
            .replace(/^bullying\s+/, "")
            .replace("cyber", "siber")
            .replace(/\s+bullying$/, "")
            .trim();
        const isUsed = reports.some(report =>
            String(report.categoryId ?? report.category_id ?? "") === String(category.id) ||
            normalizeName(report.category || report.categoryName) === normalizeName(category.name)
        );

        if (isUsed) {
            alert("Kategori tidak dapat dihapus karena masih digunakan oleh laporan.");
            return;
        }

        const previousCategories = categories;
        categories = categories.filter(item => item.id !== category.id);
        if (saveCategories()) {
            renderCategories();
        } else {
            categories = previousCategories;
            alert("Kategori gagal dihapus karena browser tidak dapat menyimpan perubahan.");
        }
    }
});

categoryForm.addEventListener("submit", event => {
    event.preventDefault();
    categoryFormError.hidden = true;

    const idValue = document.getElementById("categoryId").value;
    const existingCategory = categories.find(category => String(category.id) === idValue);
    const name = document.getElementById("categoryName").value.trim();
    const duplicateName = categories.some(category =>
        category.name.toLocaleLowerCase("id") === name.toLocaleLowerCase("id") &&
        category.id !== existingCategory?.id
    );

    if (duplicateName) {
        showFormError("Nama kategori tersebut sudah digunakan.");
        return;
    }

    const now = new Date().toISOString();
    const category = {
        id: existingCategory
            ? existingCategory.id
            : categories.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1,
        name,
        description: document.getElementById("categoryDescription").value.trim(),
        createdAt: existingCategory?.createdAt || now,
        updatedAt: now
    };

    const previousCategories = categories;
    categories = existingCategory
        ? categories.map(item => item.id === existingCategory.id ? category : item)
        : [...categories, category];

    if (saveCategories()) {
        closeCategoryModal();
        renderCategories();
    } else {
        categories = previousCategories;
        showFormError("Kategori gagal disimpan karena browser tidak dapat menyimpan perubahan.");
    }
});

renderCategories();

const STORAGE_KEY = "bullyingcare_admin_users";
const ROLES = {
    siswa: "Siswa",
    guru_bk: "Guru BK",
    psikolog: "Psikolog",
    admin: "Admin"
};
const SEED_USERS = [
    { id: 1, name: "Alya Putri", email: "alya@example.com", phone: "081234567801", role: "siswa", createdAt: "2026-10-12T08:00:00.000Z" },
    { id: 2, name: "Budi Santoso", email: "budi@example.com", phone: "081234567802", role: "siswa", createdAt: "2026-10-14T08:00:00.000Z" },
    { id: 3, name: "Dewi Lestari", email: "dewi.guru@example.com", phone: "081234567803", role: "guru_bk", createdAt: "2026-10-18T08:00:00.000Z" },
    { id: 4, name: "Rina Pratiwi", email: "rina.psikolog@example.com", phone: "081234567804", role: "psikolog", createdAt: "2026-10-20T08:00:00.000Z" },
    { id: 5, name: "Administrator", email: "admin@example.com", phone: "", role: "admin", createdAt: "2026-10-01T08:00:00.000Z" }
];

const userTable = document.getElementById("userTable");
const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");
const formError = document.getElementById("formError");
const passwordInput = document.getElementById("userPassword");
let users = loadUsers();

function loadUsers() {
    try {
        const savedUsers = localStorage.getItem(STORAGE_KEY);

        if (savedUsers === null) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
            return SEED_USERS.map(user => ({ ...user }));
        }

        const parsedUsers = JSON.parse(savedUsers);
        if (!Array.isArray(parsedUsers)) {
            throw new Error("Format data pengguna di browser tidak valid.");
        }
        return parsedUsers;
    } catch (error) {
        alert(`Data pengguna tidak dapat dibaca: ${error.message}`);
        return [];
    }
}

function saveUsers() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        return true;
    } catch {
        return false;
    }
}

function makeCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

function renderUsers() {
    const searchTerm = document.getElementById("searchUsers").value.trim().toLocaleLowerCase("id");
    const selectedRole = document.getElementById("filterRole").value;
    const filteredUsers = users.filter(user => {
        const searchableText = `${user.name} ${user.email} ${user.phone || ""}`.toLocaleLowerCase("id");
        return searchableText.includes(searchTerm) && (!selectedRole || user.role === selectedRole);
    });

    userTable.replaceChildren();
    document.getElementById("tableSummary").textContent =
        `Menampilkan ${filteredUsers.length} dari ${users.length} pengguna`;

    if (filteredUsers.length === 0) {
        const row = document.createElement("tr");
        const cell = makeCell("Tidak ada pengguna yang cocok dengan pencarian.");
        cell.colSpan = 7;
        cell.className = "empty-row";
        row.append(cell);
        userTable.append(row);
    } else {
        filteredUsers.forEach((user, index) => {
            const row = document.createElement("tr");
            row.append(makeCell(String(index + 1)));
            row.append(makeCell(user.name));
            row.append(makeCell(user.email));
            row.append(makeCell(user.phone || "—"));

            const roleCell = document.createElement("td");
            const roleBadge = document.createElement("span");
            roleBadge.className = `role-badge role-${user.role}`;
            roleBadge.textContent = ROLES[user.role] || user.role;
            roleCell.append(roleBadge);
            row.append(roleCell);
            row.append(makeCell(formatDate(user.createdAt)));

            const actionsCell = document.createElement("td");
            const actionGroup = document.createElement("div");
            actionGroup.className = "action-group";
            actionGroup.append(createActionButton("Ubah", "edit", user.id));
            actionGroup.append(createActionButton("Hapus", "delete", user.id, true));
            actionsCell.append(actionGroup);
            row.append(actionsCell);
            userTable.append(row);
        });
    }

    document.getElementById("totalUsers").textContent = String(users.length);
    document.getElementById("studentUsers").textContent = String(users.filter(user => user.role === "siswa").length);
    document.getElementById("counselorUsers").textContent = String(users.filter(user => user.role === "guru_bk").length);
    document.getElementById("psychologistUsers").textContent = String(users.filter(user => user.role === "psikolog").length);
}

function createActionButton(label, action, id, isDelete = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `action-button${isDelete ? " delete" : ""}`;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = String(id);
    button.setAttribute("aria-label", `${label} pengguna`);
    return button;
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function openModal(user = null) {
    userForm.reset();
    formError.hidden = true;
    formError.textContent = "";
    document.getElementById("userId").value = user ? String(user.id) : "";
    document.getElementById("modalTitle").textContent = user ? "Ubah Pengguna" : "Tambah Pengguna";
    document.getElementById("passwordLabel").textContent = user ? "Password baru (opsional)" : "Password";
    document.getElementById("passwordHint").textContent = user
        ? "Kosongkan jika tidak ingin mengubah password."
        : "Minimal 8 karakter. Password di-hash sebelum disimpan di browser.";
    passwordInput.required = !user;

    if (user) {
        document.getElementById("userName").value = user.name;
        document.getElementById("userEmail").value = user.email;
        document.getElementById("userPhone").value = user.phone || "";
        document.getElementById("userRole").value = user.role;
    }

    userModal.hidden = false;
    document.getElementById("userName").focus();
}

function closeModal() {
    userModal.hidden = true;
    userForm.reset();
}

function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
}

async function hashPassword(password) {
    if (!window.crypto?.subtle) {
        throw new Error("Browser tidak mendukung hashing password. Coba buka melalui localhost atau HTTPS.");
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const derivedBits = await window.crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
        key,
        256
    );
    const toHex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    return `pbkdf2-sha256$250000$${toHex(salt)}$${toHex(new Uint8Array(derivedBits))}`;
}

document.getElementById("addUserButton").addEventListener("click", () => openModal());
document.getElementById("closeModalButton").addEventListener("click", closeModal);
document.getElementById("cancelButton").addEventListener("click", closeModal);
document.getElementById("searchUsers").addEventListener("input", renderUsers);
document.getElementById("filterRole").addEventListener("change", renderUsers);

document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchUsers").value = "";
    document.getElementById("filterRole").value = "";
    renderUsers();
});

userModal.addEventListener("click", event => {
    if (event.target === userModal) closeModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !userModal.hidden) closeModal();
});

userTable.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const user = users.find(item => String(item.id) === button.dataset.id);
    if (!user) return;

    if (button.dataset.action === "edit") {
        openModal(user);
    } else if (button.dataset.action === "delete") {
        const confirmed = confirm(`Hapus pengguna "${user.name}"?`);
        if (!confirmed) return;

        const previousUsers = users;
        users = users.filter(item => item.id !== user.id);
        if (saveUsers()) {
            renderUsers();
        } else {
            users = previousUsers;
            alert("Data gagal dihapus karena browser tidak dapat menyimpan perubahan.");
        }
    }
});

userForm.addEventListener("submit", async event => {
    event.preventDefault();
    formError.hidden = true;

    const idValue = document.getElementById("userId").value;
    const existingUser = users.find(user => String(user.id) === idValue);
    const email = document.getElementById("userEmail").value.trim();
    const duplicateEmail = users.some(user =>
        user.email.toLocaleLowerCase("id") === email.toLocaleLowerCase("id") && user.id !== existingUser?.id
    );

    if (duplicateEmail) {
        showFormError("Email tersebut sudah digunakan oleh pengguna lain.");
        return;
    }

    const password = passwordInput.value;
    if (!existingUser && password.length < 8) {
        showFormError("Password harus memiliki minimal 8 karakter.");
        return;
    }

    let passwordHash = existingUser?.passwordHash || "";
    if (password) {
        try {
            passwordHash = await hashPassword(password);
        } catch (error) {
            showFormError(`Password gagal diproses: ${error.message}`);
            return;
        }
    }

    const now = new Date().toISOString();
    const user = {
        id: existingUser ? existingUser.id : users.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1,
        name: document.getElementById("userName").value.trim(),
        email,
        phone: document.getElementById("userPhone").value.trim(),
        role: document.getElementById("userRole").value,
        passwordHash,
        createdAt: existingUser?.createdAt || now,
        updatedAt: now
    };

    const previousUsers = users;
    users = existingUser
        ? users.map(item => item.id === existingUser.id ? user : item)
        : [...users, user];

    if (saveUsers()) {
        closeModal();
        renderUsers();
    } else {
        users = previousUsers;
        showFormError("Data gagal disimpan karena browser tidak dapat menyimpan perubahan.");
    }
});

renderUsers();

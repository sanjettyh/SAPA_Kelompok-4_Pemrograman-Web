const USERS_KEY = "bullyingcare_admin_users";
const SESSION_KEY = "bullyingcare_auth_session";
const form = document.getElementById("adminProfileForm");
const message = document.getElementById("profileMessage");

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
    message.hidden = false;
}

function readAdminProfile() {
    const rawUsers = localStorage.getItem(USERS_KEY);
    if (rawUsers === null) throw new Error("Data pengguna belum tersedia.");

    const users = JSON.parse(rawUsers);
    if (!Array.isArray(users)) throw new Error("Format data pengguna tidak valid.");

    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (sessionRaw === null) throw new Error("Sesi admin tidak ditemukan. Silakan masuk kembali.");
    const session = JSON.parse(sessionRaw);
    if (!session || session.role !== "admin" || session.userId === undefined) {
        throw new Error("Sesi admin tidak valid. Silakan masuk kembali.");
    }

    const admin = users.find(user =>
        user.role === "admin" && String(user.id) === String(session.userId)
    );
    if (!admin) throw new Error("Data akun admin tidak ditemukan.");
    return { users, admin };
}

function renderAdminProfile(admin) {
    const name = admin.name || "Administrator";
    document.getElementById("adminName").value = name;
    document.getElementById("adminEmail").value = admin.email || "";
    document.getElementById("adminPhone").value = admin.phone || "";
    document.getElementById("adminProfileName").textContent = name;
    document.getElementById("adminProfileAvatar").textContent =
        name.trim().charAt(0).toUpperCase() || "A";
}

try {
    const { admin } = readAdminProfile();
    renderAdminProfile(admin);
} catch (error) {
    showMessage(`Profil gagal dimuat: ${error.message}`, true);
    form.querySelectorAll("input, button").forEach(control => {
        control.disabled = true;
    });
}

form.addEventListener("submit", event => {
    event.preventDefault();
    message.hidden = true;

    let users;
    let admin;
    try {
        ({ users, admin } = readAdminProfile());
    } catch (error) {
        showMessage(`Profil gagal disimpan: ${error.message}`, true);
        return;
    }

    const name = document.getElementById("adminName").value.trim();
    const email = document.getElementById("adminEmail").value.trim();
    const phone = document.getElementById("adminPhone").value.trim();
    const duplicateEmail = users.some(user =>
        String(user.id) !== String(admin.id) &&
        String(user.email || "").toLocaleLowerCase("id") === email.toLocaleLowerCase("id")
    );

    if (duplicateEmail) {
        showMessage("Email tersebut sudah digunakan oleh pengguna lain.", true);
        return;
    }

    const updatedAdmin = { ...admin, name, email, phone, updatedAt: new Date().toISOString() };
    const updatedUsers = users.map(user =>
        String(user.id) === String(admin.id) ? updatedAdmin : user
    );

    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    } catch (error) {
        showMessage(`Profil gagal disimpan: ${error.message}`, true);
        return;
    }

    renderAdminProfile(updatedAdmin);
    showMessage("Profil admin berhasil diperbarui.");
});

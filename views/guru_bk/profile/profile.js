import "../app.js";

const USERS_KEY = "bullyingcare_admin_users";
const ACTIVE_COUNSELOR_KEY = "bullyingcare_current_guru_bk_id";
const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");

function showMessage(message, isError = false) {
    profileMessage.textContent = message;
    profileMessage.classList.toggle("error", isError);
    profileMessage.hidden = false;
}

function readCounselor() {
    const savedUsers = localStorage.getItem(USERS_KEY);
    if (savedUsers === null) throw new Error("Data pengguna Guru BK belum tersedia.");

    const users = JSON.parse(savedUsers);
    if (!Array.isArray(users)) throw new Error("Format data pengguna tidak valid.");

    const activeId = localStorage.getItem(ACTIVE_COUNSELOR_KEY);
    const counselor = users.find(user =>
        user.role === "guru_bk" && String(user.id) === activeId
    ) || users.find(user => user.role === "guru_bk");

    if (!counselor) throw new Error("Profil Guru BK tidak ditemukan.");
    return { users, counselor };
}

function fillProfile(counselor) {
    document.getElementById("profileName").value = counselor.name || "";
    document.getElementById("profileEmail").value = counselor.email || "";
    document.getElementById("profilePhone").value = counselor.phone || "";
    updateProfileDisplay(counselor);
}

function updateProfileDisplay(counselor) {
    const name = counselor.name || "Guru BK";
    document.getElementById("profileDisplayName").textContent = name;
    document.getElementById("profileAvatar").textContent = name.trim().charAt(0).toUpperCase() || "G";

    const sidebarName = document.getElementById("guruName");
    const sidebarEmail = document.getElementById("guruEmail");
    const sidebarAvatar = document.getElementById("guruAvatar");
    if (sidebarName) sidebarName.textContent = name;
    if (sidebarEmail) sidebarEmail.textContent = counselor.email || "Guru BK";
    if (sidebarAvatar) sidebarAvatar.textContent = name.trim().charAt(0).toUpperCase() || "G";

    const counselorSelect = document.getElementById("activeCounselor");
    if (counselorSelect) {
        const selectedOption = Array.from(counselorSelect.options).find(option =>
            option.value === String(counselor.id)
        );
        if (selectedOption) selectedOption.textContent = name;
    }
}

try {
    const { counselor } = readCounselor();
    fillProfile(counselor);
} catch (error) {
    showMessage(`Profil gagal dimuat: ${error.message}`, true);
    profileForm.querySelectorAll("input, button").forEach(control => {
        control.disabled = true;
    });
}

profileForm.addEventListener("submit", event => {
    event.preventDefault();
    profileMessage.hidden = true;

    let users;
    let counselor;
    try {
        ({ users, counselor } = readCounselor());
    } catch (error) {
        showMessage(`Profil gagal disimpan: ${error.message}`, true);
        return;
    }

    const name = document.getElementById("profileName").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    const phone = document.getElementById("profilePhone").value.trim();
    const duplicateEmail = users.some(user =>
        String(user.id) !== String(counselor.id) &&
        String(user.email || "").toLocaleLowerCase("id") === email.toLocaleLowerCase("id")
    );

    if (duplicateEmail) {
        showMessage("Email tersebut sudah digunakan oleh pengguna lain.", true);
        return;
    }

    const updatedCounselor = { ...counselor, name, email, phone, updatedAt: new Date().toISOString() };
    const updatedUsers = users.map(user =>
        String(user.id) === String(counselor.id) ? updatedCounselor : user
    );

    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    } catch (error) {
        showMessage(`Profil gagal disimpan: ${error.message}`, true);
        return;
    }

    updateProfileDisplay(updatedCounselor);
    showMessage("Profil berhasil diperbarui.");
});

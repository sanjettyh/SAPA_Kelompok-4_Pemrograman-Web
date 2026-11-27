const PROFILE_KEY = "sahabat_profile_demo_v1";

const DEFAULT_PROFILE = {
    name: "Aditya Saputra",
    email: "aditya@email.com",
    nis: "2026001",
    className: "XI - IPA 1",
    phone: ""
};

function readProfile() {
    try {
        return {
            ...DEFAULT_PROFILE,
            ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}")
        };
    } catch {
        return { ...DEFAULT_PROFILE };
    }
}

function loadProfile() {
    const profile = readProfile();

    document.getElementById("profileName").value = profile.name;
    document.getElementById("profileEmail").value = profile.email;
    document.getElementById("profileNis").value = profile.nis;
    document.getElementById("profileClass").value = profile.className;
    document.getElementById("profilePhone").value = profile.phone;
}

document.getElementById("profileForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const profile = {
        name: document.getElementById("profileName").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        nis: document.getElementById("profileNis").value.trim(),
        className: document.getElementById("profileClass").value.trim(),
        phone: document.getElementById("profilePhone").value.trim()
    };

    if (!profile.name || !profile.email) {
        showToast("Nama dan email wajib diisi.");
        return;
    }

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    updateGlobalProfile();

    showToast("Profil berhasil diperbarui.");

});

loadProfile();
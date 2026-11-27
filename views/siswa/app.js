/* =================================
   GLOBAL APP
================================= */

const ROOT = document.body.dataset.root || ".";
const SESSION_KEY = "bullyingcare_auth_session";

const PROFILE_KEY = "sahabat_profile_demo_v1";

const DEFAULT_PROFILE = {
    name: "Aditya Saputra",
    email: "aditya@email.com",
    nis: "2026001",
    className: "XI - IPA 1",
    phone: ""
};

function getProfile() {
    try {
        return {
            ...DEFAULT_PROFILE,
            ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}")
        };
    } catch {
        return { ...DEFAULT_PROFILE };
    }
}

function getReports() {
    try {
        return JSON.parse(
            localStorage.getItem("sahabat_reports_demo_v1") || "[]"
        );
    } catch {
        return [];
    }
}

function initials(name) {
    return name.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("");
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function getAuthSession() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        return session && typeof session === "object" ? session : null;
    } catch (error) {
        console.error("Sesi login tidak dapat dibaca.", error);
        return null;
    }
}

function getStudentRoot() {
    return new URL(`${ROOT}/`, window.location.href);
}

function enforceStudentAccess() {
    const session = getAuthSession();
    const studentRoot = getStudentRoot();
    const routesByRole = {
        admin: "../admin/dashboard/index.html",
        guru_bk: "../guru_bk/dashboard/index.html"
    };

    if (session?.role && session.role !== "siswa" && routesByRole[session.role]) {
        window.location.replace(new URL(routesByRole[session.role], studentRoot).href);
        return false;
    }

    const currentRoute = [
        "dashboard",
        "buatlaporan",
        "riwayatlaporan",
        "jadwalkonseling",
        "edukasi",
        "profile"
    ].find(route => location.pathname.includes(`/${route}/`));
    const isPublicPage = document.body.dataset.public === "true" || currentRoute === "edukasi";

    if (!isPublicPage && session?.role !== "siswa") {
        window.location.replace(new URL("../auth/index.html?role=siswa", studentRoot).href);
        return false;
    }

    return true;
}

function updateGlobalProfile() {
    const profile = getProfile();

    document.querySelectorAll("[data-user-name]").forEach(el => {
        el.textContent = profile.name;
    });

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = initials(profile.name);
    });

    document.querySelectorAll("[data-first-name]").forEach(el => {
        el.textContent = profile.name.split(/\s+/)[0];
    });
}

enforceStudentAccess();
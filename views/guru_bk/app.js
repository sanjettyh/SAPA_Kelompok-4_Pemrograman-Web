import { renderSidebar } from "./components/sidebar.js";
import { renderNavbar } from "./components/navbar.js";

const USER_STORAGE_KEY = "bullyingcare_admin_users";
const ACTIVE_COUNSELOR_KEY = "bullyingcare_current_guru_bk_id";
const DEFAULT_USERS = [
    { id: 1, name: "Alya Putri", email: "alya@example.com", role: "siswa" },
    { id: 2, name: "Budi Santoso", email: "budi@example.com", role: "siswa" },
    { id: 3, name: "Dewi Lestari", email: "dewi.guru@example.com", role: "guru_bk" },
    { id: 4, name: "Rina Pratiwi", email: "rina.psikolog@example.com", role: "psikolog" },
    { id: 5, name: "Administrator", email: "admin@example.com", role: "admin" }
];

function readUsers() {
    try {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        if (stored !== null) {
            const users = JSON.parse(stored);
            if (!Array.isArray(users)) throw new Error("Format data pengguna tidak valid.");
            return users;
        }
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS.map(user => ({ ...user }));
    } catch (error) {
        console.error("Gagal membaca pengguna lokal:", error);
        return [];
    }
}

function getActiveCounselor(users) {
    const counselors = users.filter(user => user.role === "guru_bk");
    const selectedId = localStorage.getItem(ACTIVE_COUNSELOR_KEY);
    return counselors.find(user => String(user.id) === selectedId) || counselors[0] || null;
}

function setActiveCounselor(id) {
    try {
        localStorage.setItem(ACTIVE_COUNSELOR_KEY, String(id));
        return true;
    } catch (error) {
        console.error("Gagal menyimpan profil Guru BK aktif:", error);
        return false;
    }
}

const page = document.body.dataset.page || "dashboard";
const depth = Number(document.body.dataset.depth || 0);
const title = document.body.dataset.title || "Guru BK";
const sidebarContainer = document.getElementById("sidebar-container");
const navbarContainer = document.getElementById("navbar-container");
sidebarContainer.innerHTML = await renderSidebar(page, depth);
navbarContainer.innerHTML = await renderNavbar(title);

const menuToggle = document.getElementById("guruMenuToggle");
const sidebar = sidebarContainer.querySelector(".guru-sidebar");
const sidebarBackdrop = sidebarContainer.querySelector("[data-sidebar-backdrop]");
const mobileMenuQuery = window.matchMedia("(max-width: 700px)");

function setMobileMenuOpen(open) {
    const isOpen = open && mobileMenuQuery.matches;
    document.body.classList.toggle("guru-menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    sidebar.setAttribute("aria-hidden", String(mobileMenuQuery.matches && !isOpen));
    sidebar.inert = mobileMenuQuery.matches && !isOpen;
}

menuToggle.addEventListener("click", () => {
    setMobileMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});
sidebarBackdrop.addEventListener("click", () => setMobileMenuOpen(false));
sidebar.addEventListener("click", event => {
    if (event.target.closest("a")) setMobileMenuOpen(false);
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
        setMobileMenuOpen(false);
        menuToggle.focus();
    }
});
mobileMenuQuery.addEventListener("change", () => setMobileMenuOpen(false));
setMobileMenuOpen(false);

const users = readUsers();
const counselors = users.filter(user => user.role === "guru_bk");
const counselorSelect = document.getElementById("activeCounselor");
counselors.forEach(user => {
    const option = document.createElement("option");
    option.value = String(user.id);
    option.textContent = user.name;
    counselorSelect.append(option);
});

const activeCounselor = getActiveCounselor(users);
if (activeCounselor) {
    counselorSelect.value = String(activeCounselor.id);
    document.getElementById("guruName").textContent = activeCounselor.name;
    document.getElementById("guruEmail").textContent = activeCounselor.email || "Guru BK";
    document.getElementById("guruAvatar").textContent = activeCounselor.name.trim().charAt(0).toUpperCase();
} else {
    counselorSelect.disabled = true;
    document.getElementById("guruName").textContent = "Guru BK belum tersedia";
}

counselorSelect.addEventListener("change", () => {
    if (setActiveCounselor(counselorSelect.value)) window.location.reload();
    else window.alert("Profil Guru BK tidak dapat disimpan di localStorage.");
});

document.getElementById("currentDate").textContent = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
}).format(new Date());

document.getElementById("guruLogout").addEventListener("click", () => {
    localStorage.removeItem("bullyingcare_auth_session");
    window.location.href = new URL("../../auth/index.html", window.location.href).href;
});

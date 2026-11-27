import { renderSidebar } from "./components/sidebar.js";
import { renderNavbar } from "./components/navbar.js";

const page = document.body.dataset.page || "dashboard";
const title = document.body.dataset.title || "Admin";

try {
    const [sidebar, navbar] = await Promise.all([
        renderSidebar(page),
        renderNavbar(title)
    ]);

    document.getElementById("sidebar-container").innerHTML = sidebar;
    document.getElementById("navbar-container").innerHTML = navbar;
    const sidebarMenu = document.querySelector("#sidebar-container .sidebar-menu");
    const activeLink = sidebarMenu?.querySelector("a.active");
    if (sidebarMenu && activeLink) {
        const menuBounds = sidebarMenu.getBoundingClientRect();
        const activeBounds = activeLink.getBoundingClientRect();
        if (activeBounds.top < menuBounds.top) {
            sidebarMenu.scrollTop -= menuBounds.top - activeBounds.top;
        } else if (activeBounds.bottom > menuBounds.bottom) {
            sidebarMenu.scrollTop += activeBounds.bottom - menuBounds.bottom;
        }
    }
    setupAdminMenu();
} catch (error) {
    console.error("Komponen admin gagal dimuat.", error);
    document.getElementById("sidebar-container").textContent =
        "Navigasi gagal dimuat. Jalankan dengan Live Server.";
    document.getElementById("navbar-container").textContent =
        "Navbar gagal dimuat. Jalankan dengan Live Server.";
}

function setupAdminMenu() {
    const sidebar = document.querySelector("#sidebar-container .sidebar");
    const backdrop = document.querySelector("[data-sidebar-backdrop]");
    const closeButton = document.querySelector("[data-sidebar-close]");
    const toggleButton = document.querySelector("[data-menu-toggle]");
    const mobileMenuQuery = window.matchMedia("(max-width: 850px)");

    function setMenuOpen(open) {
        const isOpen = open && mobileMenuQuery.matches;
        sidebar.classList.toggle("admin-menu-visible", isOpen);
        backdrop.classList.toggle("admin-menu-visible", isOpen);
        document.body.classList.toggle("admin-menu-open", isOpen);
        toggleButton.setAttribute("aria-expanded", String(isOpen));
        toggleButton.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
        sidebar.setAttribute("aria-hidden", String(mobileMenuQuery.matches && !isOpen));
        sidebar.inert = mobileMenuQuery.matches && !isOpen;
    }

    toggleButton.addEventListener("click", () => {
        setMenuOpen(toggleButton.getAttribute("aria-expanded") !== "true");
    });
    closeButton.addEventListener("click", () => setMenuOpen(false));
    backdrop.addEventListener("click", () => setMenuOpen(false));
    sidebar.addEventListener("click", event => {
        if (event.target.closest("a")) setMenuOpen(false);
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && toggleButton.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false);
            toggleButton.focus();
        }
    });
    mobileMenuQuery.addEventListener("change", () => setMenuOpen(false));
    setMenuOpen(false);
}
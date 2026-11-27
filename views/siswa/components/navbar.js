const studentRoot = new URL(
    `${document.body.dataset.root || "."}/`,
    window.location.href
);

async function loadNavbar() {
    const mount = document.getElementById("navbarMount");
    if (!mount) return;

    try {
        const response = await fetch(
            `${document.body.dataset.root || "."}/components/navbar.html`
        );
        if (!response.ok) throw new Error("Navbar gagal dimuat");

        mount.innerHTML = await response.text();
        setupNavigation();
        updateGlobalProfile();
    } catch (error) {
        console.error("Navbar gagal dimuat.", error);
        mount.innerHTML = `
            <div class="component-error">
                Komponen gagal dimuat. Jalankan dengan Live Server.
            </div>
        `;
    }
}

function setupNavigation() {
    const routes = [
        "dashboard",
        "buatlaporan",
        "riwayatlaporan",
        "jadwalkonseling",
        "edukasi",
        "profile"
    ];
    const current = routes.find(route =>
        location.pathname.includes(`/${route}/`)
    ) || "dashboard";
    const isStudent = getAuthSession()?.role === "siswa";
    const isPublicHome = document.body.dataset.public === "true";
    const guestNavbar = document.querySelector("[data-guest-navbar]");
    const studentNavbar = document.querySelector("[data-student-navbar]");

    if (guestNavbar) guestNavbar.hidden = isStudent && !isPublicHome;
    if (studentNavbar) studentNavbar.hidden = !isStudent || isPublicHome;

    document.querySelectorAll("[data-route]").forEach(link => {
        const route = link.dataset.route;
        link.href = new URL(`${route}/index.html`, studentRoot).href;

        if (route === current) link.classList.add("active");
    });

    const publicLinks = {
        "[data-public-home]": "index.html",
        "[data-public-education]": "edukasi/index.html",
        "[data-public-login]": "../auth/index.html?role=siswa",
        "[data-public-register]": "../auth/register.html"
    };

    Object.entries(publicLinks).forEach(([selector, path]) => {
        document.querySelectorAll(selector).forEach(link => {
            link.href = new URL(path, studentRoot).href;
        });
    });

    document.querySelectorAll("[data-public-education]").forEach(link => {
        if (current === "edukasi") link.classList.add("active");
    });

    const names = {
        dashboard: "Dashboard",
        buatlaporan: "Buat Laporan",
        riwayatlaporan: "Riwayat Laporan",
        jadwalkonseling: "Jadwal Konseling",
        edukasi: "Edukasi Anti-Bullying",
        profile: "Profil Saya"
    };
    const pageName = document.getElementById("currentPageName");

    if (pageName) pageName.textContent = names[current];

    const guestMenuToggle = document.getElementById("guestMenuToggle");
    const guestNavigation = document.getElementById("guestNavigation");
    const guestMenuQuery = window.matchMedia("(max-width: 850px)");

    function setGuestMenuOpen(open) {
        const isOpen = open && guestMenuQuery.matches;
        guestNavbar.classList.toggle("menu-open", isOpen);
        guestMenuToggle.setAttribute("aria-expanded", String(isOpen));
        guestMenuToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
        guestNavigation.setAttribute("aria-hidden", String(guestMenuQuery.matches && !isOpen));
        guestNavigation.inert = guestMenuQuery.matches && !isOpen;
    }

    guestMenuToggle.addEventListener("click", () => {
        setGuestMenuOpen(guestMenuToggle.getAttribute("aria-expanded") !== "true");
    });
    guestNavigation.addEventListener("click", event => {
        if (event.target.closest("a")) setGuestMenuOpen(false);
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && guestMenuToggle.getAttribute("aria-expanded") === "true") {
            setGuestMenuOpen(false);
            guestMenuToggle.focus();
        }
    });
    guestMenuQuery.addEventListener("change", () => setGuestMenuOpen(false));
    setGuestMenuOpen(false);

    const date = document.getElementById("currentDate");
    if (date) {
        date.textContent = new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(new Date());
    }

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const menuClose = document.getElementById("menuClose");
    const mobileMenuQuery = window.matchMedia("(max-width: 850px)");

    function setMenuOpen(open) {
        const isOpen = open && mobileMenuQuery.matches;
        sidebar.classList.toggle("open", isOpen);
        sidebarBackdrop.classList.toggle("open", isOpen);
        document.body.classList.toggle("student-menu-open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
        sidebar.setAttribute("aria-hidden", String(mobileMenuQuery.matches && !isOpen));
        sidebar.inert = mobileMenuQuery.matches && !isOpen;
    }

    menuToggle.addEventListener("click", () => {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });
    menuClose.addEventListener("click", () => setMenuOpen(false));
    sidebarBackdrop.addEventListener("click", () => setMenuOpen(false));
    sidebar.addEventListener("click", event => {
        if (event.target.closest("a")) setMenuOpen(false);
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false);
            menuToggle.focus();
        }
    });
    mobileMenuQuery.addEventListener("change", () => setMenuOpen(false));
    setMenuOpen(false);

    document.getElementById("logoutButton")?.addEventListener("click", () => {
        if (confirm("Apakah kamu yakin ingin keluar?")) {
            localStorage.removeItem("bullyingcare_auth_session");
            window.location.href = new URL("index.html", studentRoot).href;
        }
    });
}

loadNavbar();

const USERS_KEY = "bullyingcare_admin_users";
const SESSION_KEY = "bullyingcare_auth_session";
const PROFILE_KEY = "sahabat_profile_demo_v1";
const HASH_ITERATIONS = 250000;
const DEMO_ACCOUNTS = [
    { email: "admin@example.com", name: "Administrator", phone: "", role: "admin", password: "Admin123!" },
    { email: "dewi.guru@example.com", name: "Dewi Lestari", phone: "081234567803", role: "guru_bk", password: "Guru123!" },
    { email: "alya@example.com", name: "Alya Putri", phone: "081234567801", role: "siswa", password: "Siswa123!" }
];
const ROLE_ROUTES = {
    siswa: "../siswa/dashboard/index.html",
    guru_bk: "../guru_bk/dashboard/index.html",
    admin: "../admin/dashboard/index.html"
};
const page = document.body.dataset.authPage;
const encoder = new TextEncoder();

function getUsers() {
    try {
        const stored = localStorage.getItem(USERS_KEY);
        if (stored === null) return [];
        const users = JSON.parse(stored);
        if (!Array.isArray(users)) throw new Error("Format data pengguna di browser tidak valid.");
        return users;
    } catch (error) {
        throw new Error(`Data akun tidak dapat dibaca: ${error.message}`);
    }
}

function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
        throw new Error(`Data akun tidak dapat disimpan di browser: ${error.message}`);
    }
}

function requireCrypto() {
    if (!window.crypto?.subtle) {
        throw new Error("Fitur password aman tidak tersedia. Jalankan proyek melalui localhost atau HTTPS.");
    }
}

function toHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value) {
    if (!/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error("Hash password lokal tidak valid.");
    return new Uint8Array(value.match(/.{2}/g).map(byte => Number.parseInt(byte, 16)));
}

async function derivePassword(password, salt, iterations = HASH_ITERATIONS) {
    requireCrypto();
    const key = await window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    return new Uint8Array(await window.crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
    }, key, 256));
}

async function hashPassword(password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const hash = await derivePassword(password, salt);
    return `pbkdf2-sha256$${HASH_ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

async function verifyPassword(password, encodedHash) {
    if (!encodedHash || typeof encodedHash !== "string") return false;
    const [algorithm, iterationText, saltText, expectedText] = encodedHash.split("$");
    const iterations = Number(iterationText);
    if (algorithm !== "pbkdf2-sha256" ||
        !Number.isInteger(iterations) ||
        iterations < 100000 ||
        iterations > 1000000) {
        return false;
    }

    const actual = await derivePassword(password, fromHex(saltText), iterations);
    const expected = fromHex(expectedText);
    if (actual.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index += 1) {
        difference |= actual[index] ^ expected[index];
    }
    return difference === 0;
}

async function initializeDemoAccounts() {
    let users = getUsers();
    let changed = false;
    let nextId = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0) + 1;

    for (const demo of DEMO_ACCOUNTS) {
        const existing = users.find(user =>
            String(user.email || "").toLocaleLowerCase("id") === demo.email
        );
        if (existing?.passwordHash) continue;

        const passwordHash = await hashPassword(demo.password);
        if (existing) {
            existing.passwordHash = passwordHash;
            existing.updatedAt = new Date().toISOString();
        } else {
            const now = new Date().toISOString();
            users.push({
                id: nextId++,
                name: demo.name,
                email: demo.email,
                phone: demo.phone,
                role: demo.role,
                passwordHash,
                createdAt: now,
                updatedAt: now
            });
        }
        changed = true;
    }

    if (changed) saveUsers(users);
}

function setError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.hidden = false;
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    element.textContent = "";
    element.hidden = true;
}

function storeSession(user) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            userId: user.id,
            role: user.role,
            loggedAt: new Date().toISOString()
        }));

        if (user.role === "guru_bk") {
            localStorage.setItem("bullyingcare_current_guru_bk_id", String(user.id));
        }

        if (user.role === "siswa") {
            localStorage.setItem(PROFILE_KEY, JSON.stringify({
                name: user.name,
                email: user.email,
                phone: user.phone || "",
                nis: "",
                className: ""
            }));
        }
    } catch (error) {
        throw new Error(`Sesi gagal disimpan di browser: ${error.message}`);
    }
}

function redirectByRole(role) {
    const destination = ROLE_ROUTES[role];
    if (!destination) throw new Error("Role akun belum memiliki halaman tujuan.");
    window.location.href = destination;
}

async function handleLogin(event) {
    event.preventDefault();
    clearError("loginError");
    const submit = document.getElementById("loginSubmit");
    submit.disabled = true;
    submit.textContent = "Memeriksa akun...";

    try {
        await initializeDemoAccounts();
        const email = document.getElementById("loginEmail").value.trim().toLocaleLowerCase("id");
        const password = document.getElementById("loginPassword").value;
        const user = getUsers().find(item =>
            String(item.email || "").toLocaleLowerCase("id") === email
        );
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            setError("loginError", "Email atau password tidak sesuai.");
            return;
        }
        if (!ROLE_ROUTES[user.role]) {
            setError("loginError", "Role akun ini belum dapat digunakan untuk masuk.");
            return;
        }
        storeSession(user);
        redirectByRole(user.role);
    } catch (error) {
        setError("loginError", error.message);
    } finally {
        submit.disabled = false;
        submit.textContent = "Masuk";
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearError("registerError");
    const submit = document.getElementById("registerSubmit");
    submit.disabled = true;
    submit.textContent = "Membuat akun...";

    try {
        await initializeDemoAccounts();
        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLocaleLowerCase("id");
        const phone = document.getElementById("registerPhone").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmation = document.getElementById("registerPasswordConfirm").value;
        if (!name || name.length > 100) throw new Error("Nama wajib diisi dan maksimal 100 karakter.");
        if (email.length > 100) throw new Error("Email maksimal 100 karakter.");
        if (phone.length > 20) throw new Error("Nomor telepon maksimal 20 karakter.");
        if (password.length < 8) throw new Error("Password minimal 8 karakter.");
        if (password !== confirmation) throw new Error("Konfirmasi password tidak sama.");

        const users = getUsers();
        if (users.some(user =>
            String(user.email || "").toLocaleLowerCase("id") === email
        )) {
            throw new Error("Email sudah terdaftar. Silakan masuk dengan akun tersebut.");
        }

        const now = new Date().toISOString();
        const id = users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0) + 1;
        const user = {
            id,
            name,
            email,
            phone,
            role: "siswa",
            passwordHash: await hashPassword(password),
            createdAt: now,
            updatedAt: now
        };
        users.push(user);
        saveUsers(users);
        storeSession(user);
        redirectByRole(user.role);
    } catch (error) {
        setError("registerError", error.message);
    } finally {
        submit.disabled = false;
        submit.textContent = "Buat Akun Siswa";
    }
}

async function initializePage() {
    try {
        await initializeDemoAccounts();
    } catch (error) {
        const errorId = page === "register" ? "registerError" : "loginError";
        setError(errorId, error.message);
    }

    if (page === "login") {
        document.getElementById("loginForm").addEventListener("submit", handleLogin);
        document.querySelectorAll("[data-demo-email]").forEach(button => {
            button.addEventListener("click", () => {
                document.getElementById("loginEmail").value = button.dataset.demoEmail;
                document.getElementById("loginPassword").value = button.dataset.demoPassword;
            });
        });
    } else if (page === "register") {
        document.getElementById("registerForm").addEventListener("submit", handleRegister);
    }
}

initializePage();

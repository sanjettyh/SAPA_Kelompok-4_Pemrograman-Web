const SESSIONS_KEY = "bullyingcare_counseling_sessions";
const USERS_KEY = "bullyingcare_admin_users";

const STATUS_LABELS = {
    dijadwalkan: "Dijadwalkan",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan"
};

function readArray(key, label) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null) return [];

        const value = JSON.parse(stored);
        if (!Array.isArray(value)) throw new Error(`Format data ${label} tidak valid.`);
        return value;
    } catch (error) {
        console.error(`Gagal membaca ${label} dari localStorage:`, error);
        return null;
    }
}

function getStudentId() {
    try {
        const session = JSON.parse(localStorage.getItem("bullyingcare_auth_session") || "null");
        return session?.role === "siswa" ? session.userId : null;
    } catch (error) {
        console.error("Sesi login tidak dapat dibaca.", error);
        return null;
    }
}

function formatSessionDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return {
        date,
        day: date.getDate(),
        month: new Intl.DateTimeFormat("id-ID", { month: "short" })
            .format(date)
            .toUpperCase(),
        details: new Intl.DateTimeFormat("id-ID", {
            dateStyle: "long",
            timeStyle: "short"
        }).format(date)
    };
}

function showEmptyMessage(message, detail = "") {
    const empty = document.getElementById("scheduleEmpty");
    empty.replaceChildren(document.createTextNode(message));

    if (detail) {
        empty.append(document.createElement("br"), document.createTextNode(detail));
    }

    empty.style.display = "block";
}

function renderSessions() {
    const list = document.getElementById("sessionList");
    const studentId = getStudentId();
    const sessions = readArray(SESSIONS_KEY, "jadwal konseling");
    const users = readArray(USERS_KEY, "pengguna");

    list.replaceChildren();

    if (sessions === null || users === null) {
        document.getElementById("scheduleCount").textContent = "— Jadwal";
        showEmptyMessage("Data jadwal konseling gagal dibaca.", "Silakan muat ulang halaman.");
        return;
    }

    const studentSessions = studentId === null
        ? []
        : sessions.filter(session =>
            String(session.studentId ?? session.student_id) === String(studentId)
        );

    studentSessions.sort((a, b) =>
        new Date(a.sessionDate ?? a.session_date) - new Date(b.sessionDate ?? b.session_date)
    );

    document.getElementById("scheduleCount").textContent =
        `${studentSessions.length} Jadwal`;

    if (!studentSessions.length) {
        showEmptyMessage(
            "Belum ada jadwal konseling.",
            "Jadwal akan muncul setelah Guru BK membuatnya."
        );
        return;
    }

    document.getElementById("scheduleEmpty").style.display = "none";

    studentSessions.forEach(session => {
        const dateInfo = formatSessionDate(session.sessionDate ?? session.session_date);
        const counselorId = session.counselorId ?? session.counselor_id;
        const counselor = users.find(user => String(user.id) === String(counselorId));
        const type = session.sessionType ?? session.session_type;
        const status = session.sessionStatus ?? session.session_status;

        const item = document.createElement("div");
        item.className = "session-item";

        if (dateInfo) {
            const calendar = document.createElement("div");
            calendar.className = "calendar-tile";
            const day = document.createElement("strong");
            day.textContent = String(dateInfo.day);
            const month = document.createElement("span");
            month.textContent = dateInfo.month;
            calendar.append(day, month);
            item.append(calendar);
        }

        const copy = document.createElement("div");
        copy.className = "session-copy";

        const title = document.createElement("strong");
        title.textContent = counselor?.name
            ? `Konseling dengan ${counselor.name}`
            : "Jadwal Konseling";

        const details = document.createElement("p");
        details.textContent = dateInfo?.details || "Waktu belum ditentukan";

        const badge = document.createElement("span");
        badge.className = `status-badge status-${STATUS_LABELS[status] ? status : "menunggu"}`;
        badge.textContent = STATUS_LABELS[status] || status || "Dijadwalkan";

        copy.append(title, details, badge);
        item.append(copy);

        const sessionType = document.createElement("span");
        sessionType.className = "session-type";
        sessionType.textContent = type === "online" ? "Online" : "Tatap muka";
        item.append(sessionType);
        list.append(item);
    });
}

window.addEventListener("storage", event => {
    if (event.key === SESSIONS_KEY || event.key === USERS_KEY || event.key === "bullyingcare_auth_session") {
        renderSessions();
    }
});

renderSessions();

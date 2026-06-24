const TEAMMEMBERS = [
    {
        name: "GravezTV",
        role: "DOJ Owner",
        tag: "Ownership",
        image: "disp/team/graveztv.png",
        bio: "Founded San Andreas Department of Justice and leads all server operations, development direction, and community vision.",
        department: "Management",
        timezone: "CST",
        contact: "graveztv",
        highlight: "#c9a84c"
    },
    {
        name: "Aidan",
        role: "Co-Owner",
        tag: "Ownership",
        image: "disp/team/aidan.png",
        bio: "Manages the community day-to-day, organizes public events, and ensures all players have a welcoming experience.",
        department: "Management",
        timezone: "CST",
        contact: "aidannn1171",
        highlight: "#c9a84c"
    },
    {
        name: "Ronnie",
        role: "Development Manager",
        tag: "Co-Owner",
        image: "disp/team/ronnie.png",
        bio: "Oversees all development tasks, scripts, and future server updates. The technical backbone of SA-DOJ.",
        department: "Development",
        timezone: "CST",
        contact: "ronnie3377",
        highlight: "#c9a84c"
    },
    {
        name: "Mike",
        role: "Support Manager",
        tag: "Management",
        image: "disp/team/mike.png",
        bio: "Handles all support tickets, player reports, general inquiries, Tebex orders, and staff coordination.",
        department: "Support",
        timezone: "EST",
        contact: "mikedvk133",
        highlight: "#c9a84c"
    }
];

/* ── DOM refs ── */
const launchBtn  = document.getElementById("teamLaunch");
const panel      = document.getElementById("teamPanel");
const closeBtn   = document.getElementById("teamClose");
const stage      = document.getElementById("teamStage");
const prevBtn    = document.getElementById("teamPrev");
const nextBtn    = document.getElementById("teamNext");
const dotsWrap   = document.getElementById("teamDots");
const overlay    = document.getElementById("teamOverlay");

if (!launchBtn || !panel || !closeBtn || !stage || !prevBtn || !nextBtn || !dotsWrap || !overlay) {
    console.error("[SA-DOJ] One or more team UI elements are missing from the DOM.");
}

/* ── Carousel state ── */
const state = {
    position: 0,
    dragVelocity: 0,
    isDragging: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    dragOrigin: 0,
    raf: null,
    cards: [],
    dots: []
};

/* ── Helpers ── */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function wrapIndex(n, total) {
    return ((n % total) + total) % total;
}

function shortestDelta(index, pos, total) {
    let diff = index - pos;
    while (diff > total / 2) diff -= total;
    while (diff < -total / 2) diff += total;
    return diff;
}

function cardSpacing() {
    return clamp(window.innerWidth * 0.20, 180, 250);
}

function cancelAnim() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = null;
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function animateTo(target, duration) {
    duration = duration || 230;
    cancelAnim();
    const start = performance.now();
    const from  = state.position;

    function frame(now) {
        const t      = Math.min((now - start) / duration, 1);
        const eased  = easeOutCubic(t);
        state.position = from + (to - from) * eased;
        state.dragVelocity *= 0.72;
        render();
        if (t < 1) {
            state.raf = requestAnimationFrame(frame);
        } else {
            state.position    = target;
            state.dragVelocity = 0;
            render();
            state.raf = null;
        }
    }

    var to = target;
    state.raf = requestAnimationFrame(frame);
}

/* ── Colour helpers for member highlight ── */
function hexToRgb(hex) {
    if (!hex) return { r: 201, g: 168, b: 76 };
    let s = hex.replace("#", "").trim();
    if (s.length === 3) s = s.split("").map(c => c + c).join("");
    if (s.length !== 6) return { r: 201, g: 168, b: 76 };
    const n = parseInt(s, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(rgb, a) {
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

/* ── Card factory ── */
function makeCard(member) {
    const card = document.createElement("article");
    card.className = "team-card";

    const rgb = hexToRgb(member.highlight);
    card.style.setProperty("--member-hl-strong", rgba(rgb, 0.28));
    card.style.setProperty("--member-hl-soft",   rgba(rgb, 0.00));

    card.innerHTML = `
        <div class="card-top">
            <img class="card-avatar"
                 src="${member.image}"
                 alt="${member.name}"
                 onerror="this.style.opacity='0.3';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2268%22 height=%2268%22/>'">
            <div class="card-head">
                <div class="card-name">${member.name}</div>
                <div class="card-role">${member.role}</div>
                <div class="card-tag">${member.tag}</div>
            </div>
        </div>
        <div class="card-divider"></div>
        <div class="card-bio">${member.bio}</div>
        <div class="card-meta">
            <div class="meta-item">
                <div class="meta-label">Department</div>
                <div class="meta-value">${member.department}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Timezone</div>
                <div class="meta-value">${member.timezone}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Contact</div>
                <div class="meta-value">${member.contact}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Division</div>
                <div class="meta-value">SA-DOJ</div>
            </div>
        </div>
    `;

    stage.appendChild(card);
    return card;
}

/* ── Build dots ── */
function buildDots() {
    dotsWrap.innerHTML = "";
    state.dots = TEAMMEMBERS.map(function(_, i) {
        const dot = document.createElement("div");
        dot.className = "team-dot";
        dot.setAttribute("aria-label", "Member " + (i + 1));
        dot.addEventListener("click", function() { snapTo(i); });
        dotsWrap.appendChild(dot);
        return dot;
    });
}

/* ── Build all cards ── */
function buildCards() {
    stage.innerHTML = "";
    state.cards = TEAMMEMBERS.map(makeCard);
    buildDots();
    render();
}

/* ── Render carousel positions ── */
function render() {
    const total = TEAMMEMBERS.length;
    const gap   = cardSpacing();

    state.cards.forEach(function(card, index) {
        const rel     = shortestDelta(index, state.position, total);
        const abs     = Math.abs(rel);
        const x       = rel * gap;
        const y       = Math.min(abs * 7, 16);
        const scale   = 1 - Math.min(abs * 0.08, 0.18);
        const opacity = clamp(1 - abs * 0.50, 0, 1);
        const rotate  = clamp(rel * -6 + state.dragVelocity * -7, -9, 9);
        const z       = 1000 - Math.round(abs * 100);

        card.style.zIndex       = String(z);
        card.style.opacity      = abs > 2.1 ? "0" : opacity.toFixed(3);
        card.style.transform    = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale}) rotate(${rotate}deg)`;
        card.style.pointerEvents = abs < 0.85 ? "auto" : "none";
    });

    const active = wrapIndex(Math.round(state.position), total);
    state.dots.forEach(function(dot, i) {
        dot.classList.toggle("active", i === active);
    });
}

/* ── Navigation ── */
function snapTo(index) {
    const total   = TEAMMEMBERS.length;
    const current = state.position;
    let delta     = index - current;
    if (delta > total / 2)  delta -= total;
    if (delta < -total / 2) delta += total;
    animateTo(current + delta, 230);
}

function nudge(dir) {
    animateTo(Math.round(state.position) + dir, 210);
}

/* ── Panel open/close ── */
function openPanel() {
    if (typeof window.__closeSocials === "function") window.__closeSocials();
    panel.classList.add("open");
    overlay.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
}

function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
}

/* ── Drag / pointer events ── */
function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    state.isDragging  = true;
    state.startX      = e.clientX;
    state.lastX       = e.clientX;
    state.lastTime    = performance.now();
    state.dragOrigin  = state.position;
    state.dragVelocity = 0;
    stage.classList.add("dragging");
    cancelAnim();
    if (stage.setPointerCapture && e.pointerId !== undefined) {
        stage.setPointerCapture(e.pointerId);
    }
}

function onPointerMove(e) {
    if (!state.isDragging) return;
    const gap = cardSpacing();
    const dx  = e.clientX - state.startX;
    state.position = state.dragOrigin - dx / gap;

    const now     = performance.now();
    const frameDx = e.clientX - state.lastX;
    const frameDt = Math.max(now - state.lastTime, 1);
    state.dragVelocity = clamp((-frameDx / gap) * (frameDt / 16), -0.28, 0.28);
    state.lastX    = e.clientX;
    state.lastTime = now;
    render();
}

function onPointerUp(e) {
    if (!state.isDragging) return;
    state.isDragging = false;
    stage.classList.remove("dragging");
    if (stage.releasePointerCapture && e.pointerId !== undefined) {
        try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    const projected = state.position + state.dragVelocity * 0.12;
    animateTo(Math.round(projected), 220);
}

/* ── Wire up events ── */
launchBtn.addEventListener("click", function() {
    panel.classList.contains("open") ? closePanel() : openPanel();
});

closeBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);
prevBtn.addEventListener("click", function() { nudge(-1); });
nextBtn.addEventListener("click", function() { nudge(1); });

stage.addEventListener("pointerdown",   onPointerDown);
stage.addEventListener("pointermove",   onPointerMove);
stage.addEventListener("pointerup",     onPointerUp);
stage.addEventListener("pointercancel", onPointerUp);
stage.addEventListener("lostpointercapture", onPointerUp);

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closePanel();
    if (!panel.classList.contains("open")) return;
    if (e.key === "ArrowLeft")  nudge(-1);
    if (e.key === "ArrowRight") nudge(1);
});

window.addEventListener("resize", render);

/* ── Init ── */
buildCards();

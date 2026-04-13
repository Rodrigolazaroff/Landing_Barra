/* ===== SCROLL REVEAL ===== */
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) e.target.classList.add('visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
    // stagger siblings inside grids
    const parent = el.parentElement;
    if (parent.classList.contains('species-grid') ||
        parent.classList.contains('activities-grid') ||
        parent.classList.contains('charity-grid') ||
        parent.classList.contains('gallery-grid') ||
        parent.classList.contains('timeline')) {
        const siblings = Array.from(parent.querySelectorAll(':scope > .reveal'));
        const idx = siblings.indexOf(el);
        el.style.transitionDelay = `${idx * 0.1}s`;
    }
    revealObs.observe(el);
});

/* ===== HERO CANVAS ===== */
const canvas = document.getElementById('hero-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let cursorParticles = [];
let mouse = { x: -999, y: -999, active: false };
let raf;

function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor(randomY = false) { this.init(randomY); }
    init(randomY) {
        this.tall = Math.random() < 0.50; // 50% llegan hasta arriba
        this.x    = Math.random() * canvas.width;
        this.y    = randomY ? Math.random() * canvas.height : canvas.height + 10;
        this.r    = this.tall ? Math.random() * 1.1 + 0.3 : Math.random() * 1.6 + 0.4;
        this.vx   = (Math.random() - 0.5) * (this.tall ? 0.2 : 0.35);
        this.vy   = this.tall ? -(Math.random() * 0.25 + 0.08) : -(Math.random() * 0.4 + 0.15);
        this.life = Math.random() * 0.5 + 0.3;
        this.fade = this.tall ? Math.random() * 0.0006 + 0.0002 : Math.random() * 0.0025 + 0.001;
        this.hue  = 200 + Math.random() * 30;
    }
    update() {
        this.x    += this.vx;
        this.y    += this.vy;
        this.life -= this.fade;
        if (this.life <= 0 || this.y < -5) this.init(false);
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle   = `hsl(${this.hue},55%,55%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function initParticles() {
    particles = Array.from({ length: 150 }, () => new Particle(true));
}

function drawBg() {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0D1B2A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // centre glow
    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.55);
    g1.addColorStop(0,   'rgba(27,42,94,0.65)');
    g1.addColorStop(0.5, 'rgba(13,27,42,0.3)');
    g1.addColorStop(1,   'rgba(13,27,42,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // top-right accent
    const g2 = ctx.createRadialGradient(cx * 1.4, cy * 0.55, 0, cx * 1.4, cy * 0.55, canvas.width * 0.28);
    g2.addColorStop(0, 'rgba(58,110,200,0.13)');
    g2.addColorStop(1, 'rgba(58,110,200,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function spawnCursorParticle() {
    const p = new Particle(false);
    p.x    = mouse.x + (Math.random() - 0.5) * 36;
    p.y    = mouse.y + (Math.random() - 0.5) * 18;
    p.r    = Math.random() * 1.4 + 0.4;
    p.vx   = (Math.random() - 0.5) * 0.45;
    p.vy   = -(Math.random() * 0.55 + 0.2);
    p.life = Math.random() * 0.35 + 0.15;
    p.fade = 0.007 + Math.random() * 0.005;
    p.hue  = 205 + Math.random() * 25;
    return p;
}

function loop() {
    drawBg();
    particles.forEach(p => { p.update(); p.draw(); });

    // cursor burst
    if (mouse.active && Math.random() < 0.65) {
        cursorParticles.push(spawnCursorParticle());
    }
    for (let i = cursorParticles.length - 1; i >= 0; i--) {
        cursorParticles[i].update();
        cursorParticles[i].draw();
        if (cursorParticles[i].life <= 0) cursorParticles.splice(i, 1);
    }

    raf = requestAnimationFrame(loop);
}

resize();
initParticles();
loop();

window.addEventListener('resize', () => { resize(); initParticles(); });

// Mouse tracking para burbujas en el cursor
const heroEl = document.getElementById('hero');
heroEl.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
});
heroEl.addEventListener('mouseleave', () => { mouse.active = false; });

// Pause canvas when hero leaves viewport
new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) loop(); }
    else { cancelAnimationFrame(raf); raf = null; }
}, { threshold: 0 }).observe(document.getElementById('hero'));

/* ===== REMOVE WHITE BACKGROUND FROM LOGO ===== */
(function () {
    const img = document.querySelector('.logo-img');
    if (!img) return;

    function process() {
        const offscreen = document.createElement('canvas');
        offscreen.width  = img.naturalWidth;
        offscreen.height = img.naturalHeight;
        const oc = offscreen.getContext('2d');
        oc.drawImage(img, 0, 0);

        const imageData = oc.getImageData(0, 0, offscreen.width, offscreen.height);
        const d = imageData.data;
        const threshold = 230; // remove pixels where R,G,B are all >= this

        for (let i = 0; i < d.length; i += 4) {
            if (d[i] >= threshold && d[i+1] >= threshold && d[i+2] >= threshold) {
                // Scale alpha by how "white" the pixel is (smooth edges)
                const whiteness = Math.min(d[i], d[i+1], d[i+2]);
                const fade = (whiteness - threshold) / (255 - threshold);
                d[i+3] = Math.round(d[i+3] * (1 - fade));
            }
        }

        oc.putImageData(imageData, 0, 0);
        offscreen.toBlob(blob => {
            img.src = URL.createObjectURL(blob);
        }, 'image/png');
    }

    if (img.complete && img.naturalWidth) {
        process();
    } else {
        img.addEventListener('load', process, { once: true });
    }
})();

/* ===== SECTION PARTICLES (factory) ===== */
function createSectionParticles(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const cv  = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    section.style.position = 'relative';
    section.insertBefore(cv, section.firstChild);

    // ensure direct children with content sit above canvas
    Array.from(section.children).forEach(child => {
        if (child !== cv && !child.style.position) child.style.position = 'relative';
        if (child !== cv && !child.style.zIndex)   child.style.zIndex   = '1';
    });

    const cx  = cv.getContext('2d');
    let parts = [], cursorParts = [];
    let cursor = { x: -999, y: -999, active: false };
    let raf;

    function resize() { cv.width = cv.offsetWidth; cv.height = cv.offsetHeight; }

    function makePart(randomY) {
        const tall = Math.random() < 0.50;
        return {
            tall,
            x:    Math.random() * cv.width,
            y:    randomY ? Math.random() * cv.height : cv.height + 10,
            r:    tall ? Math.random() * 1.1 + 0.3 : Math.random() * 1.6 + 0.4,
            vx:   (Math.random() - 0.5) * (tall ? 0.2 : 0.35),
            vy:   tall ? -(Math.random() * 0.25 + 0.08) : -(Math.random() * 0.4 + 0.15),
            life: Math.random() * 0.5 + 0.3,
            fade: tall ? Math.random() * 0.0006 + 0.0002 : Math.random() * 0.0025 + 0.001,
            hue:  200 + Math.random() * 30,
        };
    }

    function resetPart(p) { Object.assign(p, makePart(false)); }

    function makeCursorPart() {
        return {
            x: cursor.x + (Math.random() - 0.5) * 36,
            y: cursor.y + (Math.random() - 0.5) * 18,
            r: Math.random() * 1.4 + 0.4,
            vx: (Math.random() - 0.5) * 0.45,
            vy: -(Math.random() * 0.55 + 0.2),
            life: Math.random() * 0.35 + 0.15,
            fade: 0.007 + Math.random() * 0.005,
            hue: 205 + Math.random() * 25,
        };
    }

    function updateDraw(p) {
        p.x += p.vx; p.y += p.vy; p.life -= p.fade;
        cx.save();
        cx.globalAlpha = Math.max(0, p.life);
        cx.fillStyle   = `hsl(${p.hue},55%,55%)`;
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill();
        cx.restore();
    }

    function init() {
        resize();
        parts = Array.from({ length: 150 }, () => makePart(true));
    }

    function loop() {
        cx.clearRect(0, 0, cv.width, cv.height);
        parts.forEach(p => {
            updateDraw(p);
            if (p.life <= 0 || p.y < -5) resetPart(p);
        });
        if (cursor.active && Math.random() < 0.65) cursorParts.push(makeCursorPart());
        for (let i = cursorParts.length - 1; i >= 0; i--) {
            updateDraw(cursorParts[i]);
            if (cursorParts[i].life <= 0) cursorParts.splice(i, 1);
        }
        raf = requestAnimationFrame(loop);
    }

    init();
    loop();

    section.addEventListener('mousemove', (e) => {
        const r = cv.getBoundingClientRect();
        cursor.x = e.clientX - r.left;
        cursor.y = e.clientY - r.top;
        cursor.active = true;
    });
    section.addEventListener('mouseleave', () => { cursor.active = false; });

    new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!raf) loop(); }
        else { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 }).observe(section);

    window.addEventListener('resize', init);
}

['quienes-somos', 'pesca-devolucion', 'actividades', 'galeria', 'testimonios', 'contacto']
    .forEach(createSectionParticles);

/* ===== LIGHTBOX ===== */
(function () {
    const lightbox    = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    document.querySelectorAll('.gallery-item img.gallery-img').forEach(img => {
        img.closest('.gallery-item').addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        });
    });

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    });
})();

/* ===== FLIP CARDS ===== */
document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
});

/* ===== SCROLL INDICATOR CLICK ===== */
document.querySelector('.scroll-indicator')?.addEventListener('click', () => {
    document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' });
});

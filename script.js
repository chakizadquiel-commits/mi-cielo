/* ===================================
   PALABRAS INTERCALADAS Y LLUVIA
=================================== */

const SHAPE_WORDS = [
    "TE AMO",
    "leonchita",
    "solesito",
    "mi niña"
];

const RAIN_WORDS = [
    "TE AMO",
    "leonchita",
    "solesito",
    "mi niña",
    "mi chielo",
    "mi chula"
];

/* ===================================
   CARTA PERSONAL
=================================== */

const LOVE_NOTE = `Colachooonchito te quelo dechir q no ay nada q se compare con lo q chiento por ti de verdad tamo y ño quelo q esto che acabe usualmente intento chey fuerte pala ti pala loch doch y aguantay algunach cochas pala ño preocuparte yio tamoo mi niña hermosa elech todo lo q chiempre quiche elech mi mujey hermosa elech muy espechial en mi vida ño quelo q jamach te vayach mi niña amo cada rasgo de ti tus ojos tus gestos tu forma de caminar tu forma de hablar todo mi reina no ay album q represente más lo q siento por ti como el de Paulo por eso te lo dedique poq es una mezcla de todo lo q me llegaste y me llegas hacer sentir cuando estoy contigo che q aveches ay problemach entre nochotros pelo intento q echo no nos gane tamooo demachiado mi mujer hermosa ❤️🥺`;

document.getElementById("message").textContent = LOVE_NOTE;

/* ===================================
   ELEMENTOS Y VARIABLES DE ESTADO
=================================== */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const audio = document.getElementById("song");

const startLayer = document.getElementById("start");
const letterLayer = document.getElementById("letter");
const counterLayer = document.getElementById("counter");

let W = 0;
let H = 0;

let particles = [];
let rain = [];

let audioCtx = null;
let analyser = null;
let data = null;

let started = false;
let finished = false;

let level = 0;
let progress = 0;
let realDuration = 183.8;

let rainWordIndex = 0;

/* Detectar duración real del audio */
audio.addEventListener('loadedmetadata', () => {
    if (audio.duration && !isNaN(audio.duration)) {
        realDuration = audio.duration;
    }
});

/* ===================================
   AJUSTAR PANTALLA
=================================== */

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = innerWidth;
    H = innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    makeTargets();
    makeRain();
}

window.addEventListener("resize", resize);

/* ===================================
   FORMAR REBECA ZOE Y CORAZÓN AZUL
=================================== */

function makeTargets() {
    const off = document.createElement("canvas");
    const o = off.getContext("2d");

    off.width = Math.floor(Math.min(W * 0.96, 1250));
    off.height = Math.floor(Math.min(H * 0.42, 340));

    const fs = Math.min(
        off.width / 10.2,
        off.height * 0.58
    );

    o.fillStyle = "#fff";
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.font = `900 ${fs}px Arial`;

    const centerY = off.height * 0.48;

    // Nombre
    o.fillText(
        "REBECA ZOE",
        off.width * 0.43,
        centerY
    );

    // Corazón azul al final del nombre
    const heartX = off.width * 0.83;
    const heartY = centerY + fs * 0.02;
    const hs = fs * 0.28;

    o.beginPath();
    o.moveTo(heartX, heartY + hs * 0.72);
    o.bezierCurveTo(
        heartX - hs * 1.8,
        heartY - hs * 0.35,
        heartX - hs * 1.05,
        heartY - hs * 1.55,
        heartX,
        heartY - hs * 0.72
    );
    o.bezierCurveTo(
        heartX + hs * 1.05,
        heartY - hs * 1.55,
        heartX + hs * 1.8,
        heartY - hs * 0.35,
        heartX,
        heartY + hs * 0.72
    );
    o.closePath();
    o.fill();

    const pixels = o.getImageData(0, 0, off.width, off.height).data;
    const pts = [];

    for (let y = 0; y < off.height; y += 14) {
        for (let x = 0; x < off.width; x += 22) {
            if (pixels[(y * off.width + x) * 4 + 3] > 120) {
                pts.push({
                    x: x - off.width / 2 + W / 2,
                    y: y - off.height / 2 + H / 2,
                    isHeart: x > off.width * 0.72
                });
            }
        }
    }

    particles = pts.map((p, idx) => ({
        x: Math.random() * W,
        y: Math.random() * H - H,
        tx: p.x,
        ty: p.y,
        word: p.isHeart ? "💙" : SHAPE_WORDS[idx % SHAPE_WORDS.length],
        isHeart: p.isHeart,
        // Escalonado para formar secuencialmente
        delay: idx / pts.length
    }));
}

/* ===================================
   LLUVIA
=================================== */

function makeRain() {
    rain = Array.from(
        { length: Math.floor(W / 22) },
        () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            s: 12 + Math.random() * 8,
            v: 1 + Math.random() * 1.8
        })
    );
}

/* ===================================
   ANIMACIÓN CON PROGRESO ACELERADO Y FLUIDO
=================================== */

function draw(t) {
    ctx.clearRect(0, 0, W, H);

    let beat = 0;

    if (analyser && data) {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        level = (sum / data.length) / 255;
        beat = level;
    }

    if (started && !finished) {
        /* LLUVIA DE PALABRAS DE FONDO SUAVE */
        ctx.font = "12px Arial";
        ctx.fillStyle = `rgba(140, 180, 220, ${0.12 + beat * 0.15})`;

        rain.forEach((r, index) => {
            const word = RAIN_WORDS[(index + rainWordIndex) % RAIN_WORDS.length];
            ctx.fillText(word, r.x, r.y);

            r.y += r.v * (1 + beat * 3);

            if (r.y > H + 20) {
                r.y = -20;
                r.x = Math.random() * W;
            }
        });

        if (Math.random() < 0.025 + beat * 0.08) {
            rainWordIndex = (rainWordIndex + 1) % RAIN_WORDS.length;
        }

        /* PROGRESO ACELERADO (Avanza un 35% más rápido para no quedarse atrás) */
        const currentDuration = (audio.duration && !isNaN(audio.duration)) ? audio.duration : realDuration;
        progress = Math.min(1, (audio.currentTime / currentDuration) * 1.35);

        const fontSize = Math.max(10, Math.min(14, W / 75));
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";

        particles.forEach((p) => {
            if (progress >= p.delay) {
                // Mayor velocidad de atracción para fijar rápido cada letra
                p.x += (p.tx - p.x) * (0.05 + beat * 0.08);
                p.y += (p.ty - p.y) * (0.05 + beat * 0.08);

                if (p.isHeart) {
                    ctx.fillStyle = `rgba(59, 130, 246, ${0.9 + beat * 0.1})`;
                    ctx.shadowColor = "#3b82f6";
                    ctx.shadowBlur = 8 + beat * 12;
                } else {
                    ctx.fillStyle = `rgba(190, 215, 240, ${0.85 + beat * 0.15})`;
                    ctx.shadowColor = "#6699cc";
                    ctx.shadowBlur = 3 + beat * 6;
                }

                ctx.fillText(p.word, p.x, p.y);
            }
        });

        ctx.shadowBlur = 0;

        /* DESTELLOS DISCRETOS EN EL BEAT */
        if (beat > 0.28) {
            for (let k = 0; k < Math.floor(beat * 14); k++) {
                const x = Math.random() * W;
                const y = Math.random() * H;

                ctx.fillStyle = `rgba(160, 200, 240, ${Math.random() * 0.5})`;
                ctx.fillRect(x, y, 1.5, 1.5);
            }
        }
    }

    requestAnimationFrame(draw);
}

/* ===================================
   EVENTOS Y NAVEGACIÓN
=================================== */

function finish() {
    if (finished) return;
    finished = true;
    document.getElementById("status").textContent = "PARA REBECA ZOE 💙";
    letterLayer.style.display = "flex";
}

document.getElementById("startBtn").addEventListener("click", async () => {
    if (started) return;

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.resume();

        const source = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        data = new Uint8Array(analyser.frequencyBinCount);

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        await audio.play();
        started = true;
        startLayer.classList.add("hidden");
    } catch (error) {
        alert("No se pudo iniciar la canción. Comprueba que alucinaciones.m4a esté junto a los archivos.");
    }
});

audio.addEventListener("ended", finish);

document.getElementById("counterBtn").addEventListener("click", () => {
    letterLayer.style.display = "none";
    counterLayer.style.display = "flex";
    updateCounter();
});

document.getElementById("backBtn").addEventListener("click", () => {
    counterLayer.style.display = "none";
    letterLayer.style.display = "flex";
});

/* ===================================
   CONTADOR
=================================== */

function updateCounter() {
    const start = new Date(2024, 3, 30, 0, 0, 0);
    const now = new Date();

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const elapsed = Math.max(0, now - start);
    const totalDays = Math.floor(elapsed / 86400000);

    const values = {
        years: years,
        months: years * 12 + months,
        weeks: Math.floor(totalDays / 7),
        days: totalDays,
        hours: Math.floor((elapsed % 86400000) / 3600000),
        minutes: Math.floor((elapsed % 3600000) / 60000),
        seconds: Math.floor((elapsed % 60000) / 1000)
    };

    for (const [id, value] of Object.entries(values)) {
        document.getElementById(id).textContent = value.toLocaleString("es-MX");
    }
}

/* ===================================
   INICIALIZACIÓN
=================================== */

resize();
requestAnimationFrame(draw);

setInterval(() => {
    if (counterLayer.style.display === "flex") {
        updateCounter();
    }
}, 1000);
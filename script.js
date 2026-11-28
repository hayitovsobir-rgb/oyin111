const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 50 ta Mashina Turi (1-dan 50-gacha tezlik va narx oshib boradi)
const CAR_NAMES = [
    "Klassik Sedan", "Shahar Xetchbek", "Kompakt Kupe", "Sport Sedan", "Turbo Xetch",
    "Krossover GT", "Rodster S1", "Sport Kupe", "Turbo Rodster", "Drift S15",
    "Muscle V6", "GT Sport", "Apex Kupe", "Vortex R", "Muscle V8",
    "Turbo GT-R", "Drift Pro", "Kiber Sedan", "Storm V8", "Phantom GT",
    "Kiber Bolide", "Viper GTS", "Cobra R", "Nitro Coupe", "Superkar V8",
    "Titan GT", "Fury V10", "Superkar V10", "Apex Predator", "Solaris GT",
    "Plazma GTS", "Venom V12", "Hyperion S", "Nebula GT", "Mirage V12",
    "Giperkar Z", "Valkyrie R", "Zenith GT", "Eclipse X", "Horizon V12",
    "Kvantum Prototip", "Nova Hyper", "Pulsar X", "Chronos GT", "Aether V16",
    "Singularity X", "Tachyon GT", "Infinity Warp", "Celestial 4D", "4D Warp Omega"
];

const CAR_PALETTES = [
    { color: "#3b82f6", roof: "#1d4ed8", neon: "#60a5fa" },
    { color: "#10b981", roof: "#047857", neon: "#34d399" },
    { color: "#06b6d4", roof: "#0e7490", neon: "#22d3ee" },
    { color: "#eab308", roof: "#a16207", neon: "#facc15" },
    { color: "#f97316", roof: "#c2410c", neon: "#fb923c" },
    { color: "#ef4444", roof: "#b91c1c", neon: "#f87171" },
    { color: "#ec4899", roof: "#be185d", neon: "#f472b6" },
    { color: "#8b5cf6", roof: "#6d28d9", neon: "#a78bfa" },
    { color: "#14b8a6", roof: "#0f766e", neon: "#2dd4bf" },
    { color: "#d946ef", roof: "#86198f", neon: "#e879f9" }
];

const CARS = [];
for (let i = 0; i < 50; i++) {
    const palette = CAR_PALETTES[i % CAR_PALETTES.length];
    CARS.push({
        id: i,
        name: `${i + 1}. ${CAR_NAMES[i]}`,
        price: i === 0 ? 0 : Math.round(500 * Math.pow(i, 1.45)), // Narx bosqichma-bosqich oshadi
        maxSpeed: 220 + (i * 20), // 1-mashina: 220 km/s -> 50-mashina: 1200 km/s!
        accel: +(0.55 + (i * 0.045)).toFixed(3), // Tezlanish ham har bir mashinada oshadi
        handling: +(0.025 + (i * 0.00035)).toFixed(4), // Burilish boshqaruvi silliq va barqaror
        color: palette.color,
        roof: palette.roof,
        neon: palette.neon,
        width: +(1.82 + (i * 0.006)).toFixed(3)
    });
}

// 200 ta Bosqich — Finish 1,000,000 m dan boshlanadi va botlar tezligi har bosqichda oshadi!
const THEMES = [
    { skyTop: "#020617", skyMid: "#1e1b4b", skyBot: "#3b82f6", curbA: "#38bdf8", curbB: "#f8fafc" },
    { skyTop: "#1c1917", skyMid: "#7c2d12", skyBot: "#f59e0b", curbA: "#f59e0b", curbB: "#fef08a" },
    { skyTop: "#022c22", skyMid: "#064e3b", skyBot: "#10b981", curbA: "#10b981", curbB: "#a7f3d0" },
    { skyTop: "#2e1065", skyMid: "#701a75", skyBot: "#f43f5e", curbA: "#f43f5e", curbB: "#fbcfe8" },
    { skyTop: "#090d16", skyMid: "#312e81", skyBot: "#a855f7", curbA: "#a855f7", curbB: "#38bdf8" }
];

const LEVELS = [];
for (let i = 0; i < 200; i++) {
    const theme = THEMES[i % THEMES.length];
    LEVELS.push({
        index: i,
        number: i + 1,
        distance: 1000000 + (i * 50000), // 1-bosqich 1,000,000 m, keyingi har bir bosqich +50,000 m
        botSpeedCap: 175 + (i * 4.5), // Har bosqichda botlar tezligi +4.5 km/s ga oshadi (200-bosqichda ~1070 km/s)
        botAccelBonus: i * 0.008, // Botlarning tezlanishi ham bosqich sayin kuchayadi
        reward: 1000 + (i * 250),
        curveSeed: (i + 1) * 1.37,
        ...theme
    });
}

// Saqlangan o'yin ma'lumotlari
let saveData = JSON.parse(localStorage.getItem('race4d_save_v2')) || {
    coins: 500,
    ownedCars: [0],
    selectedCar: 0,
    unlockedLevel: 1,
    selectedLevel: 1
};

function saveProgress() {
    localStorage.setItem('race4d_save_v2', JSON.stringify(saveData));
}

const START_Z = 50;
let currentLevel = LEVELS[saveData.selectedLevel - 1];
let currentCar = CARS[saveData.selectedCar];
let FINISH_Z = START_Z + currentLevel.distance;

let player = { name: "Siz", x: 0, z: START_Z, speed: 0, finished: false, finishTime: 0, isPlayer: true };
let robots = [];
let obstacles = [];
let nextObstacleZ = START_Z + 800;
let raceStartTime = 0;
let gameState = 'MENU';

const keys = { up: false, down: false, left: false, right: false };

// Trassa burilishini hisoblash
function getRoadCurve(z) {
    if (z < START_Z + 120 || z > FINISH_Z - 150) return 0;
    const s = currentLevel.curveSeed;
    const wave1 = Math.sin(z * 0.0022 + s);
    const wave2 = Math.cos(z * 0.0009 + s * 0.5);
    return (wave1 * 0.65 + wave2 * 0.45);
}

// 4D Tezlik chiziqlari
let speedLines = [];
for (let i = 0; i < 40; i++) {
    speedLines.push({
        angle: Math.random() * Math.PI * 2,
        dist: 100 + Math.random() * 400,
        length: 20 + Math.random() * 50,
        speed: 5 + Math.random() * 12
    });
}

// Web Audio API
let audioCtx = null, osc = null, gainNode = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        osc = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 50;
        gainNode.gain.value = 0.03;

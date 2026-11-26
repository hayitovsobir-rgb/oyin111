const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 12 xil Mashina Turi (Pulli va har biri keyingisidan tezroq)
const CARS = [
    { id: 0, name: "Klassik Sedan", price: 0, maxSpeed: 220, accel: 0.55, handling: 0.026, color: "#3b82f6", roof: "#1d4ed8", neon: "#60a5fa", width: 1.82 },
    { id: 1, name: "Shahar Xetchbek", price: 600, maxSpeed: 245, accel: 0.62, handling: 0.027, color: "#10b981", roof: "#047857", neon: "#34d399", width: 1.84 },
    { id: 2, name: "Sport Kupe", price: 1400, maxSpeed: 270, accel: 0.70, handling: 0.028, color: "#06b6d4", roof: "#0e7490", neon: "#22d3ee", width: 1.86 },
    { id: 3, name: "Turbo Rodster", price: 2500, maxSpeed: 295, accel: 0.78, handling: 0.029, color: "#eab308", roof: "#a16207", neon: "#facc15", width: 1.88 },
    { id: 4, name: "Muscle V8", price: 4000, maxSpeed: 320, accel: 0.88, handling: 0.030, color: "#f97316", roof: "#c2410c", neon: "#fb923c", width: 1.94 },
    { id: 5, name: "Drift GT", price: 6000, maxSpeed: 345, accel: 0.96, handling: 0.031, color: "#ef4444", roof: "#b91c1c", neon: "#f87171", width: 1.92 },
    { id: 6, name: "Kiber Bolide", price: 8500, maxSpeed: 370, accel: 1.05, handling: 0.032, color: "#ec4899", roof: "#be185d", neon: "#f472b6", width: 1.95 },
    { id: 7, name: "Superkar V10", price: 11500, maxSpeed: 395, accel: 1.15, handling: 0.033, color: "#8b5cf6", roof: "#6d28d9", neon: "#a78bfa", width: 1.98 },
    { id: 8, name: "Plazma GTS", price: 15000, maxSpeed: 420, accel: 1.25, handling: 0.034, color: "#14b8a6", roof: "#0f766e", neon: "#2dd4bf", width: 2.00 },
    { id: 9, name: "Giperkar Z", price: 20000, maxSpeed: 450, accel: 1.36, handling: 0.035, color: "#f43f5e", roof: "#9f1239", neon: "#fb7185", width: 2.02 },
    { id: 10, name: "Kvantum Prototip", price: 27000, maxSpeed: 480, accel: 1.48, handling: 0.036, color: "#6366f1", roof: "#4338ca", neon: "#818cf8", width: 2.05 },
    { id: 11, name: "4D Warp Omega", price: 36000, maxSpeed: 520, accel: 1.62, handling: 0.037, color: "#d946ef", roof: "#86198f", neon: "#e879f9", width: 2.08 }
];

// 200 ta Bosqich — Finish kamida 50,000,000 m (50 000 km) dan boshlanadi!
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
        distance: 50000 + (i * 500), // 1-bosqich 50,000,000 m, keyingi har bir bosqich +500,000 m!
        botSpeedCap: 165 + (i * 1.4),
        reward: 1500 + (i * 150),
        curveSeed: (i + 1) * 1.37,
        ...theme
    });
}

// Saqlangan o'yin ma'lumotlari
let saveData = JSON.parse(localStorage.getItem('race4d_save_v1')) || {
    coins: 500,
    ownedCars: [0],
    selectedCar: 0,
    unlockedLevel: 1,
    selectedLevel: 1
};

function saveProgress() {
    localStorage.setItem('race4d_save_v1', JSON.stringify(saveData));
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
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function updateAudio() {
    if (osc && gainNode && gameState === 'RACING') {
        osc.frequency.value = 42 + (player.speed * 0.55);
        gainNode.gain.value = 0.02 + (player.speed / currentCar.maxSpeed) * 0.04;
    } else if (gainNode) {
        gainNode.gain.value = 0;
    }
}

// Ekranlarni boshqarish
const screens = {
    menu: document.getElementById('mainMenuScreen'),
    garage: document.getElementById('garageScreen'),
    levels: document.getElementById('levelsScreen'),
    finish: document.getElementById('finishScreen')
};

function hideAllOverlays() {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
}

function toggleHud(show) {
    ['gameHud', 'leaderboard', 'touchControls', 'keyboardHint'].forEach(id => {
        const el = document.getElementById(id);
        if (show) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
}

function openMainMenu() {
    gameState = 'MENU';
    hideAllOverlays();
    toggleHud(false);
    currentLevel = LEVELS[saveData.selectedLevel - 1];
    currentCar = CARS[saveData.selectedCar];

    document.getElementById('menuCoinsDisplay').innerText = saveData.coins;
    document.getElementById('menuUnlockedDisplay').innerText = `${saveData.unlockedLevel} / 200`;
    document.getElementById('menuSelectedLevelText').innerText = `${currentLevel.number}-Bosqich (${currentLevel.distance.toLocaleString()} m)`;
    document.getElementById('menuSelectedCarText').innerText = `${currentCar.name} (${currentCar.maxSpeed} km/s)`;

    screens.menu.classList.remove('hidden');
}

function openGarage() {
    gameState = 'GARAGE';
    hideAllOverlays();
    toggleHud(false);
    document.getElementById('garageCoinsDisplay').innerText = saveData.coins;

    const grid = document.getElementById('carGrid');
    grid.innerHTML = '';

    CARS.forEach(car => {
        const isOwned = saveData.ownedCars.includes(car.id);
        const isSelected = saveData.selectedCar === car.id;

        const card = document.createElement('div');
        card.className = `car-card ${isSelected ? 'selected' : ''}`;

        let btnHtml = '';
        if (isSelected) {
            btnHtml = `<button class="car-action-btn equipped">✔ Tanlangan</button>`;
        } else if (isOwned) {
            btnHtml = `<button class="car-action-btn select" onclick="selectCar(${car.id})">Tanlash</button>`;
        } else {
            btnHtml = `<button class="car-action-btn buy" onclick="buyCar(${car.id})">💰 ${car.price} tanga</button>`;
        }

        card.innerHTML = `
            <div>
                <div class="car-color-dot" style="background: ${car.color};"></div>
                <h3>${car.name}</h3>
                <p class="speed-tag">Maks tezlik: ${car.maxSpeed} km/s</p>
                <p>Tezlanish: ${Math.round(car.accel * 100)}%</p>
            </div>
            ${btnHtml}
        `;
        grid.appendChild(card);
    });

    screens.garage.classList.remove('hidden');
}

window.buyCar = function(carId) {
    const car = CARS[carId];
    if (saveData.coins >= car.price) {
        saveData.coins -= car.price;
        saveData.ownedCars.push(carId);
        saveData.selectedCar = carId;
        saveProgress();
        openGarage();
    } else {
        alert(`Mablag' yetarli emas! Sizga yana ${car.price - saveData.coins} tanga kerak.`);
    }
};

window.selectCar = function(carId) {
    saveData.selectedCar = carId;
    saveProgress();
    openGarage();
};

function openLevels() {
    gameState = 'LEVELS';
    hideAllOverlays();
    toggleHud(false);
    document.getElementById('levelsUnlockedBadge').innerText = saveData.unlockedLevel;

    const grid = document.getElementById('levelsGrid');
    grid.innerHTML = '';

    LEVELS.forEach(lvl => {
        const isUnlocked = lvl.number <= saveData.unlockedLevel;
        const isSelected = lvl.number === saveData.selectedLevel;

        const btn = document.createElement('div');
        btn.className = `lvl-btn ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        btn.innerHTML = `
            <span class="lvl-num">${isUnlocked ? lvl.number + '-bosqich' : '🔒 ' + lvl.number}</span>
            <span class="lvl-dist">${(lvl.distance / 1000000).toFixed(1)} mln m</span>
        `;
        if (isUnlocked) {
            btn.addEventListener('click', () => {
                saveData.selectedLevel = lvl.number;
                saveProgress();
                openMainMenu();
            });
        }
        grid.appendChild(btn);
    });

    screens.levels.classList.remove('hidden');
}

document.getElementById('menuPlayBtn').addEventListener('click', startRace);
document.getElementById('menuGarageBtn').addEventListener('click', openGarage);
document.getElementById('menuLevelsBtn').addEventListener('click', openLevels);
document.getElementById('closeGarageBtn').addEventListener('click', openMainMenu);
document.getElementById('closeLevelsBtn').addEventListener('click', openMainMenu);
document.getElementById('hudMenuBtn').addEventListener('click', openMainMenu);

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    if (saveData.selectedLevel < 200) {
        saveData.selectedLevel++;
        saveProgress();
    }
    startRace();
});
document.getElementById('finishGarageBtn').addEventListener('click', openGarage);
document.getElementById('restartRaceBtn').addEventListener('click', startRace);

function startRace() {
    currentLevel = LEVELS[saveData.selectedLevel - 1];
    currentCar = CARS[saveData.selectedCar];
    FINISH_Z = START_Z + currentLevel.distance;

    hideAllOverlays();
    toggleHud(true);

    document.getElementById('hudLevelDisplay').innerText = `${currentLevel.number} / 200`;

    player = {
        name: "Siz",
        x: -0.25,
        z: START_Z,
        speed: 0,
        finished: false,
        finishTime: 0,
        isPlayer: true
    };

    const cap = currentLevel.botSpeedCap;
    const botConfigs = [
        { name: "Bot-Alfa", x: 0.25, maxSpeed: cap * 0.82, accel: 0.42, color: "#ef4444", roof: "#991b1b", neon: "#ff4444" },
        { name: "Bot-Kiber", x: -0.75, maxSpeed: cap * 0.88, accel: 0.46, color: "#eab308", roof: "#a16207", neon: "#facc15" },
        { name: "Bot-Vorteks", x: 0.75, maxSpeed: cap * 0.92, accel: 0.50, color: "#06b6d4", roof: "#0e7490", neon: "#22d3ee" },
        { name: "Bot-Titan", x: -0.50, maxSpeed: cap * 0.96, accel: 0.54, color: "#ec4899", roof: "#9d174d", neon: "#f472b6" },
        { name: "Bot-Omega", x: 0.50, maxSpeed: cap * 1.00, accel: 0.58, color: "#8b5cf6", roof: "#5b21b6", neon: "#c084fc" }
    ];

    robots = botConfigs.map((cfg, idx) => ({
        ...cfg,
        z: START_Z + 8 + (idx * 4),
        speed: 0,
        targetX: cfg.x,
        finished: false,
        finishTime: 0,
        isPlayer: false
    }));

    // Dinamik to'siqlar ro'yxatini tozalash (50 000 000 m uchun xotirani tejaydi)
    obstacles = [];
    nextObstacleZ = START_Z + 800;

    gameState = 'COUNTDOWN';
    const cdEl = document.getElementById('countdownOverlay');
    cdEl.classList.remove('hidden');
    let count = 3;
    cdEl.innerText = count;

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            cdEl.innerText = count;
        } else if (count === 0) {
            cdEl.innerText = "START!";
            gameState = 'RACING';
            raceStartTime = performance.now();
            initAudio();
        } else {
            cdEl.classList.add('hidden');
            clearInterval(timer);
        }
    }, 700);
}

// Klaviatura va Sensor boshqaruvi
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

function bindTouchButton(btnId, keyName) {
    const btn = document.getElementById(btnId);
    const startAction = (e) => { e.preventDefault(); keys[keyName] = true; btn.classList.add('active'); };
    const endAction = (e) => { e.preventDefault(); keys[keyName] = false; btn.classList.remove('active'); };
    btn.addEventListener('mousedown', startAction);
    btn.addEventListener('mouseup', endAction);
    btn.addEventListener('mouseleave', endAction);
    btn.addEventListener('touchstart', startAction, { passive: false });
    btn.addEventListener('touchend', endAction, { passive: false });
}
bindTouchButton('btnUp', 'up');
bindTouchButton('btnDown', 'down');
bindTouchButton('btnLeft', 'left');
bindTouchButton('btnRight', 'right');

// 4D Proyeksiya
function project4D(x, y, z, camX, camY, camZ, dynamicFov) {
    const dz = z - camZ;
    if (dz <= 1) return null;
    const scale = dynamicFov / dz;
    const screenX = (canvas.width / 2) + (x - camX) * scale * 120;
    const screenY = (canvas.height * 0.42) - (y - camY) * scale * 120;
    return { x: screenX, y: screenY, scale: scale };
}

function update() {
    if (gameState !== 'RACING') {
        updateAudio();
        return;
    }

    // 1. O'yinchi harakati
    if (!player.finished) {
        if (keys.up) player.speed += currentCar.accel;
        else if (keys.down) player.speed -= currentCar.accel * 1.8;
        else player.speed *= 0.986;

        if (player.speed > currentCar.maxSpeed) player.speed = currentCar.maxSpeed;
        if (player.speed < 0) player.speed = 0;

        const currentCurve = getRoadCurve(player.z);
        if (player.speed > 20) {
            player.x -= currentCurve * (player.speed / 350) * 0.011;
        }

        const turnSpeed = player.speed > 5 ? currentCar.handling : currentCar.handling * 0.4;
        if (keys.left) player.x -= turnSpeed;
        if (keys.right) player.x += turnSpeed;

        if (player.x < -1.14) { player.x = -1.14; player.speed *= 0.96; }
        if (player.x > 1.14) { player.x = 1.14; player.speed *= 0.96; }

        player.z += player.speed * 0.14;

        // Dinamik to'siqlarni yaratish va o'tib ketilganlarini tozalash
        while (nextObstacleZ < player.z + 2200 && nextObstacleZ < FINISH_Z - 400) {
            obstacles.push({
                z: nextObstacleZ,
                x: (Math.random() * 1.5) - 0.75
            });
            nextObstacleZ += 850 + Math.random() * 450;
        }
        obstacles = obstacles.filter(obs => obs.z > player.z - 50);

        // To'siqlarga urilishni tekshirish
        obstacles.forEach(obs => {
            if (Math.abs(obs.z - player.z) < 6 && Math.abs(obs.x - player.x) < 0.25) {
                player.speed *= 0.65;
                obs.z -= 40;
            }
        });

        if (player.z >= FINISH_Z) {
            player.finished = true;
            player.finishTime = ((performance.now() - raceStartTime) / 1000).toFixed(2);
            handleRaceFinish();
        }
    } else {
        player.speed *= 0.96;
        player.z += player.speed * 0.14;
    }

    // 2. Robot poygachilar
    const allRacers = [player, ...robots];
    robots.forEach(bot => {
        if (!bot.finished) {
            bot.speed += bot.accel * (0.85 + Math.random() * 0.2);
            if (bot.speed > bot.maxSpeed) bot.speed = bot.maxSpeed;

            if (Math.random() < 0.01) {
                bot.targetX = (Math.random() * 1.5) - 0.75;
            }
            bot.x += (bot.targetX - bot.x) * 0.025;
            bot.z += bot.speed * 0.14;

            if (bot.z >= FINISH_Z) {
                bot.finished = true;
                bot.finishTime = ((performance.now() - raceStartTime) / 1000).toFixed(2);
            }
        } else {
            bot.speed *= 0.95;
            bot.z += bot.speed * 0.14;
        }
    });

    // 3. Mashinalararo to'qnashuv
    for (let i = 0; i < allRacers.length; i++) {
        for (let j = i + 1; j < allRacers.length; j++) {
            const a = allRacers[i], b = allRacers[j];
            if (Math.abs(a.z - b.z) < 11 && Math.abs(a.x - b.x) < 0.32) {
                if (a.x < b.x) { a.x -= 0.03; b.x += 0.03; }
                else { a.x += 0.03; b.x -= 0.03; }
                a.speed *= 0.95;
                b.speed *= 0.95;
            }
        }
    }

    // 4. HUD yangilash
    const sorted = [...allRacers].sort((a, b) => b.z - a.z);
    const playerRank = sorted.findIndex(r => r.isPlayer) + 1;

    document.getElementById('hudRankDisplay').innerText = `${playerRank} / 6`;
    document.getElementById('hudSpeedDisplay').innerText = `${Math.round(player.speed)} km/s`;

    const covered = Math.max(0, Math.min(currentLevel.distance, player.z - START_Z));
    const pct = Math.min(100, (covered / currentLevel.distance) * 100);
    document.getElementById('hudProgressBar').style.width = `${pct}%`;
    document.getElementById('hudDistanceText').innerText = `${Math.round(covered).toLocaleString()} / ${currentLevel.distance.toLocaleString()} m`;

    document.getElementById('leaderboard').innerHTML = sorted.map((r, idx) => `
        <div class="lb-item ${r.isPlayer ? 'player' : ''}">
            <span>${idx + 1}. ${r.name}</span>
            <span>${r.finished ? '🏁' : Math.round(Math.max(0, r.z - START_Z)).toLocaleString() + 'm'}</span>
        </div>
    `).join('');

    updateAudio();
}

function handleRaceFinish() {
    gameState = 'FINISHED';
    const allRacers = [player, ...robots].sort((a, b) => b.z - a.z);
    const playerRank = allRacers.findIndex(r => r.isPlayer) + 1;

    const rankMultiplier = playerRank === 1 ? 1 : (playerRank === 2 ? 0.7 : (playerRank === 3 ? 0.5 : 0.3));
    const earnedCoins = Math.round(currentLevel.reward * rankMultiplier);
    saveData.coins += earnedCoins;

    if (playerRank <= 3 && currentLevel.number >= saveData.unlockedLevel && saveData.unlockedLevel < 200) {
        saveData.unlockedLevel = currentLevel.number + 1;
    }
    saveProgress();

    document.getElementById('finishTitle').innerText = playerRank === 1
        ? `🏆 ${currentLevel.number}-BOSQICH G'OLIBI!`
        : `🏁 MARRAGA ${playerRank}-O'RINDA KELDINGIZ!`;
    document.getElementById('finishSubtitle').innerText = `Vaqt: ${player.finishTime} s | Masofa: ${currentLevel.distance.toLocaleString()} m`;
    document.getElementById('finishRewardCoins').innerText = earnedCoins;

    document.getElementById('finalResultsList').innerHTML = allRacers.map((r, idx) => `
        <div class="result-row ${r.isPlayer ? 'player-row' : ''}">
            <span><b>#${idx + 1}</b> ${r.name}</span>
            <span>${r.finished ? r.finishTime + ' s' : 'Yo\'lda...'}</span>
        </div>
    `).join('');

    screens.finish.classList.remove('hidden');
}

// 4D Grafikani va egri trassani chizish
function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const horizonY = h * 0.42;

    const speedRatio = player.speed / 520;
    const shakeX = gameState === 'RACING' ? (Math.random() - 0.5) * speedRatio * 5 : 0;
    const shakeY = gameState === 'RACING' ? (Math.random() - 0.5) * speedRatio * 3 : 0;
    const dynamicFov = 320 - (speedRatio * 50);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Osmon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, currentLevel.skyTop);
    skyGrad.addColorStop(0.55, currentLevel.skyMid);
    skyGrad.addColorStop(1, currentLevel.skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-10, -10, w + 20, horizonY + 10);

    // Ufq quyoshi
    const horizonCurveShift = getRoadCurve(player.z) * 110;
    const sunGrad = ctx.createLinearGradient(0, horizonY * 0.15, 0, horizonY);
    sunGrad.addColorStop(0, '#fde047');
    sunGrad.addColorStop(0.5, '#f43f5e');
    sunGrad.addColorStop(1, currentLevel.skyBot);
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.5 - horizonCurveShift, horizonY * 0.65, 75, 0, Math.PI * 2);
    ctx.fill();

    // 2. Yer
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    groundGrad.addColorStop(0, '#090d16');
    groundGrad.addColorStop(1, '#111827');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(-10, horizonY, w + 20, h - horizonY + 20);

    // 3. Egri Yo'l Segmentlari
    const camX = player.x * 0.55;
    const camY = 1.55;
    const camZ = player.z - 28;
    const segLen = 20;
    const numSegs = 100;
    const startSeg = Math.floor(camZ / segLen);

    let curveOffsets = new Array(numSegs + 2).fill(0);
    let dx = 0;
    let ddx = 0;
    for (let i = 1; i <= numSegs + 1; i++) {
        const zWorld = (startSeg + i) * segLen;
        if (zWorld > player.z) {
            ddx += getRoadCurve(zWorld) * 0.016;
            dx += ddx;
        }
        curveOffsets[i] = dx;
    }

    for (let i = numSegs; i >= 1; i--) {
        const segIdx = startSeg + i;
        const z1 = segIdx * segLen;
        const z2 = (segIdx + 1) * segLen;
        if (z1 <= camZ + 1) continue;

        const c1 = curveOffsets[i];
        const c2 = curveOffsets[i + 1];

        const p1L = project4D(-1.35 + c1, 0, z1, camX, camY, camZ, dynamicFov);
        const p1R = project4D(1.35 + c1, 0, z1, camX, camY, camZ, dynamicFov);
        const p2L = project4D(-1.35 + c2, 0, z2, camX, camY, camZ, dynamicFov);
        const p2R = project4D(1.35 + c2, 0, z2, camX, camY, camZ, dynamicFov);

        if (!p1L || !p2L) continue;

        const isDark = segIdx % 2 === 0;
        ctx.fillStyle = isDark ? '#1e293b' : '#0f172a';
        ctx.beginPath();
        ctx.moveTo(p1L.x, p1L.y);
        ctx.lineTo(p1R.x, p1R.y);
        ctx.lineTo(p2R.x, p2R.y);
        ctx.lineTo(p2L.x, p2L.y);
        ctx.closePath();
        ctx.fill();

        const curbW1 = (p1R.x - p1L.x) * 0.04;
        const curbW2 = (p2R.x - p2L.x) * 0.04;
        ctx.fillStyle = isDark ? currentLevel.curbA : currentLevel.curbB;

        ctx.beginPath();
        ctx.moveTo(p1L.x - curbW1, p1L.y);
        ctx.lineTo(p1L.x, p1L.y);
        ctx.lineTo(p2L.x, p2L.y);
        ctx.lineTo(p2L.x - curbW2, p2L.y);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(p1R.x, p1R.y);
        ctx.lineTo(p1R.x + curbW1, p1R.y);
        ctx.lineTo(p2R.x + curbW2, p2R.y);
        ctx.lineTo(p2R.x, p2R.y);
        ctx.fill();

        if (isDark) {
            const lineW1 = (p1R.x - p1L.x) * 0.012;
            const lineW2 = (p2R.x - p2L.x) * 0.012;
            const mid1 = (p1L.x + p1R.x) / 2;
            const mid2 = (p2L.x + p2R.x) / 2;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.moveTo(mid1 - lineW1, p1L.y);
            ctx.lineTo(mid1 + lineW1, p1L.y);
            ctx.lineTo(mid2 + lineW2, p2L.y);
            ctx.lineTo(mid2 - lineW2, p2L.y);
            ctx.fill();
        }
    }

    function getCurveAtZ(zTarget) {
        const idx = Math.floor((zTarget - camZ) / segLen);
        if (idx <= 0) return 0;
        if (idx >= numSegs) return curveOffsets[numSegs];
        const frac = ((zTarget - camZ) % segLen) / segLen;
        return curveOffsets[idx] + (curveOffsets[idx + 1] - curveOffsets[idx]) * frac;
    }

    // 4. START va FINISH Arkalari
    drawBannerArch(START_Z + 12, "START", "#22c55e", getCurveAtZ(START_Z + 12), camX, camY, camZ, dynamicFov, horizonY);
    drawBannerArch(FINISH_Z, "FINISH", "#facc15", getCurveAtZ(FINISH_Z), camX, camY, camZ, dynamicFov, horizonY);

    // 5. Yo'l cheti ustunlari
    const firstPost = Math.floor(camZ / 40) * 40;
    for (let zPost = firstPost + 1900; zPost > camZ + 5; zPost -= 40) {
        const side = (zPost / 40) % 2 === 0 ? -1 : 1;
        const cOff = getCurveAtZ(zPost);
        const pos = project4D(side * 2.1 + cOff, 0, zPost, camX, camY, camZ, dynamicFov);
        if (!pos || pos.y < horizonY) continue;
        const size = pos.scale * 130;
        ctx.fillStyle = currentLevel.curbA;
        ctx.fillRect(pos.x - size * 0.04, pos.y - size * 0.9, size * 0.08, size * 0.9);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - size * 0.95, size * 0.14, 0, Math.PI * 2);
        ctx.fill();
    }

    // 6. To'siqlar (Konuslar)
    obstacles.forEach(obs => {
        if (obs.z > camZ + 2 && obs.z < camZ + 1800) {
            const cOff = getCurveAtZ(obs.z);
            const pos = project4D(obs.x + cOff, 0, obs.z, camX, camY, camZ, dynamicFov);
            if (!pos || pos.y < horizonY) return;
            const s = pos.scale * 55;
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - s);
            ctx.lineTo(pos.x - s * 0.45, pos.y);
            ctx.lineTo(pos.x + s * 0.45, pos.y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(pos.x - s * 0.25, pos.y - s * 0.5, s * 0.5, s * 0.16);
        }
    });

    // 7. Robot mashinalari
    const sortedRobots = [...robots].sort((a, b) => b.z - a.z);
    sortedRobots.forEach(bot => {
        if (bot.z <= camZ + 2) return;
        const cOff = getCurveAtZ(bot.z);
        const pos = project4D(bot.x + cOff, 0, bot.z, camX, camY, camZ, dynamicFov);
        if (!pos || pos.y < horizonY - 20) return;
        const botTilt = getRoadCurve(bot.z) * 0.05;
        draw4DCar(pos.x, pos.y, pos.scale * 120, bot.color, bot.roof, bot.neon, botTilt, bot.name, false);
    });

    // 8. O'z mashinangiz
    const playerPos = project4D(player.x, 0, player.z, camX, camY, camZ, dynamicFov);
    const playerScreenX = playerPos ? playerPos.x : (w / 2);
    const playerScreenY = h - 65;
    const playerTilt = (keys.left ? -0.055 : (keys.right ? 0.055 : 0)) + getRoadCurve(player.z) * 0.025;
    const playerCarSize = Math.min(210, w * 0.24) * (currentCar.width / 1.85);

    draw4DCar(
        playerScreenX,
        playerScreenY,
        playerCarSize,
        currentCar.color,
        currentCar.roof,
        currentCar.neon,
        playerTilt,
        "SIZ",
        true
    );

    // 9. 4D Tezlik chiziqlari
    if (player.speed > 150 && gameState === 'RACING') {
        const alpha = Math.min(0.6, (player.speed - 150) / 320);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 2;
        const cx = w / 2, cy = horizonY;

        speedLines.forEach(line => {
            line.dist += line.speed * (player.speed / 130);
            if (line.dist > Math.max(w, h)) line.dist = 80;
            const x1 = cx + Math.cos(line.angle) * line.dist;
            const y1 = cy + Math.sin(line.angle) * line.dist;
            const x2 = cx + Math.cos(line.angle) * (line.dist + line.length * speedRatio * 2);
            const y2 = cy + Math.sin(line.angle) * (line.dist + line.length * speedRatio * 2);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
    }

    ctx.restore();
}

function drawBannerArch(zPos, text, color, curveOffset, camX, camY, camZ, dynamicFov, horizonY) {
    if (zPos <= camZ + 2 || zPos > camZ + 2200) return;
    const pL = project4D(-1.45 + curveOffset, 0, zPos, camX, camY, camZ, dynamicFov);
    const pR = project4D(1.45 + curveOffset, 0, zPos, camX, camY, camZ, dynamicFov);
    if (!pL || !pR || pL.y < horizonY) return;

    const archW = pR.x - pL.x;
    const archH = archW * 0.42;

    ctx.fillStyle = color;
    ctx.fillRect(pL.x, pL.y - archH * 0.06, archW, archH * 0.08);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(pL.x - archW * 0.04, pL.y - archH, archW * 0.06, archH);
    ctx.fillRect(pR.x - archW * 0.02, pR.y - archH, archW * 0.06, archH);

    ctx.fillStyle = color;
    ctx.fillRect(pL.x - archW * 0.04, pL.y - archH, archW * 1.08, archH * 0.28);

    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.max(10, Math.floor(archH * 0.2))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, (pL.x + pR.x) / 2, pL.y - archH * 0.79);
}

function draw4DCar(x, y, size, bodyColor, roofColor, neonColor, tilt, label, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    const w = size;
    const h = size * 0.48;

    ctx.shadowColor = neonColor;
    ctx.shadowBlur = isPlayer ? 28 : 14;
    ctx.fillStyle = neonColor;
    ctx.beginPath();
    ctx.ellipse(0, 4, w * 0.56, h * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#050811';
    ctx.fillRect(-w * 0.53, -h * 0.36, w * 0.17, h * 0.40);
    ctx.fillRect(w * 0.36, -h * 0.36, w * 0.17, h * 0.40);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-w * 0.48, -h * 0.66, w * 0.96, h * 0.54, 10);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(-w * 0.42, -h * 0.62, w * 0.84, h * 0.08);

    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, -h * 0.66);
    ctx.lineTo(-w * 0.23, -h * 1.06);
    ctx.lineTo(w * 0.23, -h * 1.06);
    ctx.lineTo(w * 0.34, -h * 0.66);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, -h * 0.69);
    ctx.lineTo(-w * 0.19, -h * 0.99);
    ctx.lineTo(w * 0.19, -h * 0.99);
    ctx.lineTo(w * 0.28, -h * 0.69);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-w * 0.46, -h * 0.76, w * 0.92, h * 0.07);
    ctx.fillRect(-w * 0.36, -h * 0.70, w * 0.06, h * 0.08);
    ctx.fillRect(w * 0.30, -h * 0.70, w * 0.06, h * 0.08);

    if ((isPlayer && keys.up && player.speed > 90) || (!isPlayer && gameState === 'RACING')) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-w * 0.27, -h * 0.18, w * 0.06, 0, Math.PI * 2);
        ctx.arc(w * 0.27, -h * 0.18, w * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = (isPlayer && keys.down) ? '#ff0000' : '#f43f5e';
    ctx.fillRect(-w * 0.44, -h * 0.52, w * 0.24, h * 0.14);
    ctx.fillRect(w * 0.20, -h * 0.52, w * 0.24, h * 0.14);

    if (!isPlayer && size > 28) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${Math.max(10, Math.floor(size * 0.13))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, -h * 1.22);
    }

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

openMainMenu();
gameLoop();
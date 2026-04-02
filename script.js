console.log("Sci-fi animation started");

const state = {
  theme: "matrix",
  matrixColor: "#00ff00",
  boost: 1,
  boostDecay: 0,
  audioReady: false,
  audioLevel: 0,
  fps: 60
};

const THEMES = {
  matrix: {
    className: "theme-matrix",
    matrixColor: "#00ff00",
    base: 0x00ff66,
    emissive: 0x0c572e,
    particle: 0x86ffc9,
    floorMain: 0x00ff6f,
    floorSub: 0x0f5128
  },
  cyber: {
    className: "theme-cyber",
    matrixColor: "#2bd5ff",
    base: 0x34d6ff,
    emissive: 0x0e2f5f,
    particle: 0x9de7ff,
    floorMain: 0x3fd7ff,
    floorSub: 0x123858
  },
  warning: {
    className: "theme-warning",
    matrixColor: "#ff4747",
    base: 0xff4545,
    emissive: 0x5f1212,
    particle: 0xffb3b3,
    floorMain: 0xff6363,
    floorSub: 0x552020
  },
  amber: {
    className: "theme-amber",
    matrixColor: "#ffc14d",
    base: 0xffbf3d,
    emissive: 0x5a3e10,
    particle: 0xffe2a4,
    floorMain: 0xffcc66,
    floorSub: 0x59471f
  }
};

const fpsEl = document.getElementById("metric-fps");
const micEl = document.getElementById("metric-mic");
const energyEl = document.getElementById("metric-energy");
const fluxEl = document.getElementById("metric-flux");
const particlesEl = document.getElementById("metric-particles");
const statusEl = document.getElementById("metric-status");
const logEl = document.getElementById("system-log");
const powerEl = document.getElementById("power-level");

const audioToggle = document.getElementById("audio-toggle");
const bootEl = document.getElementById("boot-sequence");
const bootFill = document.getElementById("boot-fill");
const bootStatus = document.getElementById("boot-status");
const presentationToggle = document.getElementById("presentation-toggle");
const cameraButtons = document.querySelectorAll("[data-camera]");
const radarCanvas = document.getElementById("radar-canvas");
const radarCtx = radarCanvas ? radarCanvas.getContext("2d") : null;

const abilityButtons = document.querySelectorAll("[data-ability]");
const themeButtons = document.querySelectorAll("[data-theme]");

const cameraProfiles = {
  cinematic: { x: 0, y: 1.0, z: 7.6 },
  tactical: { x: 0, y: 2.2, z: 5.1 },
  orbit: { x: 0, y: 1.2, z: 5.8 }
};

const dragState = {
  active: false,
  targetX: 0,
  targetY: 0,
  velX: 0,
  velY: 0,
  lastX: 0,
  lastY: 0,
  lastMoveTime: 0
};

const presentationState = {
  active: false,
  angle: 0
};

const radarBlips = Array.from({ length: 8 }, () => ({
  angle: Math.random() * Math.PI * 2,
  radius: 0.15 + Math.random() * 0.78,
  speed: 0.001 + Math.random() * 0.003,
  pulse: Math.random() * Math.PI * 2
}));

const logs = [
  "Calibrating hologram lattice...",
  "Quantum floor grid synchronized.",
  "Particle relay stable.",
  "Neural telemetry uplink secured.",
  "Spectral tower heartbeat nominal.",
  "Diagnostic wave accepted.",
  "Listening channel armed."
];

const SOUND_LIBRARY = {
  uiClick: { path: "assets/sounds/ui-click.mp3", volume: 0.35 },
  bootComplete: { path: "assets/sounds/boot-complete.mp3", volume: 0.5 },
  ambience: { path: "assets/sounds/ambience-loop.mp3", volume: 0.24, loop: true },
  abilityPulse: { path: "assets/sounds/ability-pulse.mp3", volume: 0.55 },
  abilityEmp: { path: "assets/sounds/ability-emp.mp3", volume: 0.58 },
  abilityScan: { path: "assets/sounds/ability-scan.mp3", volume: 0.52 },
  abilityOverclock: { path: "assets/sounds/ability-overclock.mp3", volume: 0.58 },
  themeSwitch: { path: "assets/sounds/theme-switch.mp3", volume: 0.38 },
  cameraSwitch: { path: "assets/sounds/camera-switch.mp3", volume: 0.38 },
  presentationToggle: { path: "assets/sounds/presentation-toggle.mp3", volume: 0.45 },
  audioEnabled: { path: "assets/sounds/audio-enabled.mp3", volume: 0.45 },
  audioDisabled: { path: "assets/sounds/audio-disabled.mp3", volume: 0.45 },
  audioError: { path: "assets/sounds/audio-error.mp3", volume: 0.45 }
};

const soundState = {
  enabled: true,
  unlocked: false,
  clips: {}
};

let logIndex = 0;
let lastTime = performance.now();

function pushLog(message) {
  logEl.textContent = message;
}

function createSoundClip(path, volume, loop = false) {
  const clip = new Audio(path);
  clip.preload = "auto";
  clip.volume = volume;
  clip.loop = loop;
  clip.dataset.lastErrorAt = "0";

  clip.addEventListener("error", () => {
    clip.dataset.lastErrorAt = String(Date.now());
  });

  return clip;
}

function initializeSoundPlaceholders() {
  Object.entries(SOUND_LIBRARY).forEach(([key, config]) => {
    soundState.clips[key] = createSoundClip(config.path, config.volume, Boolean(config.loop));
  });
}

function playSound(key, options = {}) {
  if (!soundState.enabled || !soundState.unlocked) {
    return;
  }

  const clip = soundState.clips[key];
  if (!clip) {
    return;
  }

  const lastErrorAt = Number(clip.dataset.lastErrorAt || "0");
  const now = Date.now();

  // Retry loading after transient failures (e.g., Live Server restart).
  if (lastErrorAt > 0 && now - lastErrorAt > 3000) {
    clip.load();
    clip.dataset.lastErrorAt = "0";
  }

  const restart = options.restart !== false;
  if (restart) {
    clip.currentTime = 0;
  }

  clip.play().catch((error) => {
    if (error && error.name === "NotAllowedError") {
      if (typeof options.onBlocked === "function") {
        options.onBlocked(error);
      }
      return;
    }

    clip.dataset.lastErrorAt = String(Date.now());
  });
}

function setSoundEnabled(isEnabled) {
  soundState.enabled = isEnabled;

  const ambience = soundState.clips.ambience;
  if (ambience) {
    if (isEnabled && soundState.unlocked) {
      playSound("ambience", { restart: false });
    } else {
      ambience.pause();
      ambience.currentTime = 0;
    }
  }
}

function unlockSoundOnFirstGesture() {
  if (soundState.unlocked) {
    return;
  }

  soundState.unlocked = true;
  if (soundState.enabled) {
    playSound("ambience", { restart: false });
    pushLog("Ambience started after user interaction.");
  }
}

function attemptAmbientAutoplay() {
  soundState.unlocked = true;
  playSound("ambience", {
    restart: false,
    onBlocked: () => {
      soundState.unlocked = false;
      pushLog("Autoplay blocked by browser. Click or press any key to start ambience.");
    }
  });
}

function updateBootSequence() {
  let progress = 0;
  const tick = setInterval(() => {
    progress += 4 + Math.random() * 6;
    if (progress > 100) {
      progress = 100;
    }

    bootFill.style.width = `${progress}%`;
    bootStatus.textContent = `Boot sequence: ${Math.floor(progress)}%`;

    if (progress >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        bootEl.classList.add("hidden");
      }, 260);
      setTimeout(() => {
        bootEl.remove();
      }, 920);
      pushLog("Core systems online. Awaiting command.");
      playSound("bootComplete");
    }
  }, 130);
}

initializeSoundPlaceholders();

if (window.gsap) {
  gsap.from(".panel", {
    y: -35,
    opacity: 0,
    duration: 1.4
  });

  gsap.from(".hud", {
    opacity: 0,
    y: 18,
    stagger: 0.1,
    duration: 1,
    ease: "power2.out"
  });
}

window.addEventListener("pointerdown", unlockSoundOnFirstGesture, { once: true });
window.addEventListener("keydown", unlockSoundOnFirstGesture, { once: true });
window.addEventListener("touchstart", unlockSoundOnFirstGesture, { once: true, passive: true });

setSoundEnabled(true);
attemptAmbientAutoplay();
updateBootSequence();

const matrixCanvas = document.getElementById("matrix");
const matrixCtx = matrixCanvas.getContext("2d");
const matrixLetters = "01";
const matrixFontSize = 14;
let matrixColumns = 0;
const matrixDrops = [];

function resizeMatrix() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = window.devicePixelRatio || 1;

  matrixCanvas.width = Math.floor(width * scale);
  matrixCanvas.height = Math.floor(height * scale);
  matrixCanvas.style.width = `${width}px`;
  matrixCanvas.style.height = `${height}px`;
  matrixCtx.setTransform(scale, 0, 0, scale, 0, 0);

  matrixColumns = Math.floor(width / matrixFontSize);
  matrixDrops.length = matrixColumns;

  for (let i = 0; i < matrixColumns; i++) {
    if (typeof matrixDrops[i] !== "number") {
      matrixDrops[i] = 1;
    }
  }
}

function drawMatrix() {
  matrixCtx.fillStyle = "rgba(0, 0, 0, 0.06)";
  matrixCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  matrixCtx.fillStyle = state.matrixColor;
  matrixCtx.font = `${matrixFontSize}px monospace`;

  for (let i = 0; i < matrixDrops.length; i++) {
    const char = matrixLetters[Math.floor(Math.random() * matrixLetters.length)];
    matrixCtx.fillText(char, i * matrixFontSize, matrixDrops[i] * matrixFontSize);

    if (matrixDrops[i] * matrixFontSize > window.innerHeight && Math.random() > 0.975) {
      matrixDrops[i] = 0;
    }

    matrixDrops[i] += 1;
  }
}

resizeMatrix();

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x001108, 7, 22);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.2, 5.8);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("three-container").appendChild(renderer.domElement);

let composer = null;
let bloomPass = null;
let rgbShiftPass = null;

if (
  typeof THREE.EffectComposer === "function" &&
  typeof THREE.RenderPass === "function" &&
  typeof THREE.UnrealBloomPass === "function" &&
  typeof THREE.ShaderPass === "function" &&
  THREE.RGBShiftShader
) {
  composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.9,
    0.6,
    0.25
  );
  composer.addPass(bloomPass);

  rgbShiftPass = new THREE.ShaderPass(THREE.RGBShiftShader);
  rgbShiftPass.uniforms.amount.value = 0.00075;
  composer.addPass(rgbShiftPass);
} else {
  pushLog("PostFX modules missing. Running in compatibility mode.");
}

const ambientLight = new THREE.AmbientLight(0x2cff88, 0.32);
scene.add(ambientLight);

const mainLight = new THREE.PointLight(0x48ff9d, 1.2, 30, 2);
mainLight.position.set(0, 3, 4);
scene.add(mainLight);

const rimLight = new THREE.PointLight(0x6cffc0, 0.6, 22, 2);
rimLight.position.set(-2.8, 1, -3.6);
scene.add(rimLight);

const towerGroup = new THREE.Group();
scene.add(towerGroup);

const coreMaterial = new THREE.MeshPhongMaterial({
  color: 0x1eff7a,
  emissive: 0x0a582c,
  emissiveIntensity: 0.72,
  transparent: true,
  opacity: 0.42,
  shininess: 90,
  side: THREE.DoubleSide
});

const shellMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff77,
  wireframe: true,
  transparent: true,
  opacity: 0.72
});

const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x5dffaf,
  transparent: true,
  opacity: 0.58
});

const cubeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff99,
  wireframe: true
});

const core = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 2.6, 22, 1, true), coreMaterial);
towerGroup.add(core);

const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 3.1, 8, 1, true), shellMaterial);
towerGroup.add(shell);

const rings = [];
for (let i = 0; i < 4; i++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92 + i * 0.09, 0.012, 10, 70), ringMaterial.clone());
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.95 + i * 0.68;
  rings.push(ring);
  towerGroup.add(ring);
}

const topSpire = new THREE.Mesh(
  new THREE.ConeGeometry(0.2, 0.56, 16),
  new THREE.MeshBasicMaterial({ color: 0x77ffc2, wireframe: true })
);
topSpire.position.y = 1.65;
towerGroup.add(topSpire);

const cube = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), cubeMaterial);
cube.position.y = -0.15;
towerGroup.add(cube);

const shardGroup = new THREE.Group();
towerGroup.add(shardGroup);

for (let i = 0; i < 14; i++) {
  const shard = new THREE.Mesh(
    new THREE.TetrahedronGeometry(0.07 + Math.random() * 0.14),
    new THREE.MeshBasicMaterial({
      color: 0x7affc2,
      transparent: true,
      opacity: 0.65,
      wireframe: Math.random() > 0.5
    })
  );

  const radius = 1.2 + Math.random() * 1.1;
  const angle = (Math.PI * 2 * i) / 14;
  shard.position.set(Math.cos(angle) * radius, -0.7 + Math.random() * 2.2, Math.sin(angle) * radius);
  shard.userData = {
    speed: 0.004 + Math.random() * 0.01,
    radius,
    angle,
    yBase: shard.position.y
  };

  shardGroup.add(shard);
}

const droneGroup = new THREE.Group();
scene.add(droneGroup);

for (let i = 0; i < 3; i++) {
  const drone = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16),
    new THREE.MeshBasicMaterial({ color: 0x70ffc8, wireframe: true })
  );

  drone.userData = {
    radius: 2.4 + i * 0.45,
    speed: 0.35 + i * 0.18,
    offset: i * (Math.PI * 0.66)
  };

  droneGroup.add(drone);
}

const floorGroup = new THREE.Group();
scene.add(floorGroup);

const gridFloor = new THREE.GridHelper(16, 36, 0x00ff6f, 0x0f5128);
gridFloor.position.y = -1.45;
floorGroup.add(gridFloor);

const floorDisk = new THREE.Mesh(
  new THREE.CircleGeometry(5.3, 50),
  new THREE.MeshBasicMaterial({
    color: 0x0f3f23,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  })
);
floorDisk.rotation.x = -Math.PI / 2;
floorDisk.position.y = -1.44;
floorGroup.add(floorDisk);

const particleCount = 560;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const r = 2 + Math.random() * 4.2;
  const theta = Math.random() * Math.PI * 2;
  const y = -1.6 + Math.random() * 5.6;

  particlePositions[i * 3] = Math.cos(theta) * r;
  particlePositions[i * 3 + 1] = y;
  particlePositions[i * 3 + 2] = Math.sin(theta) * r;
}

particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: 0x7fffc8,
  size: 0.022,
  transparent: true,
  opacity: 0.56,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

const starsCount = 900;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 120;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 80;
  starPositions[i * 3 + 2] = -10 - Math.random() * 80;
}

starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0x8effc8,
    size: 0.055,
    transparent: true,
    opacity: 0.44,
    depthWrite: false
  })
);
scene.add(stars);

const effectGroup = new THREE.Group();
scene.add(effectGroup);

renderer.domElement.addEventListener("pointerdown", (e) => {
  dragState.active = true;
  dragState.lastX = e.clientX;
  dragState.lastY = e.clientY;
  dragState.lastMoveTime = performance.now();
  dragState.velX = 0;
  dragState.velY = 0;
});

window.addEventListener("pointerup", () => {
  dragState.active = false;
});

window.addEventListener("pointermove", (e) => {
  if (!dragState.active) {
    return;
  }

  const now = performance.now();
  const dt = Math.max(16, now - dragState.lastMoveTime);
  const deltaX = e.clientX - dragState.lastX;
  const deltaY = e.clientY - dragState.lastY;

  dragState.targetY += deltaX * 0.008;
  dragState.targetX += deltaY * 0.002;
  dragState.targetX = Math.max(-0.35, Math.min(0.35, dragState.targetX));

  dragState.velY = deltaX / dt;
  dragState.velX = deltaY / dt;

  dragState.lastX = e.clientX;
  dragState.lastY = e.clientY;
  dragState.lastMoveTime = now;
});

function setCameraMode(modeName) {
  const profile = cameraProfiles[modeName];
  if (!profile) {
    return;
  }

  if (window.gsap) {
    gsap.to(camera.position, {
      x: profile.x,
      y: profile.y,
      z: profile.z,
      duration: 0.65,
      ease: "power2.out"
    });
  } else {
    camera.position.set(profile.x, profile.y, profile.z);
  }

  cameraButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-camera") === modeName);
  });

  pushLog(`Camera mode: ${modeName.toUpperCase()}`);
  playSound("cameraSwitch");
}

cameraButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setCameraMode(button.getAttribute("data-camera"));
  });
});

if (presentationToggle) {
  presentationToggle.addEventListener("click", () => {
    presentationState.active = !presentationState.active;
    document.body.classList.toggle("presentation-mode", presentationState.active);
    presentationToggle.classList.toggle("active", presentationState.active);
    pushLog(presentationState.active ? "Presentation mode enabled." : "Presentation mode disabled.");
    playSound("presentationToggle");
  });
}

function drawRadar(timeMs) {
  if (!radarCtx || !radarCanvas) {
    return;
  }

  const w = radarCanvas.width;
  const h = radarCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const outer = w * 0.42;

  radarCtx.clearRect(0, 0, w, h);
  radarCtx.fillStyle = "rgba(0, 8, 3, 0.9)";
  radarCtx.fillRect(0, 0, w, h);

  radarCtx.strokeStyle = "rgba(70, 255, 140, 0.35)";
  radarCtx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, (outer * i) / 4, 0, Math.PI * 2);
    radarCtx.stroke();
  }

  radarCtx.beginPath();
  radarCtx.moveTo(cx - outer, cy);
  radarCtx.lineTo(cx + outer, cy);
  radarCtx.moveTo(cx, cy - outer);
  radarCtx.lineTo(cx, cy + outer);
  radarCtx.stroke();

  const sweep = (timeMs * 0.0014) % (Math.PI * 2);
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.arc(cx, cy, outer, sweep - 0.26, sweep + 0.06);
  radarCtx.closePath();
  radarCtx.fillStyle = "rgba(40, 255, 130, 0.2)";
  radarCtx.fill();

  radarBlips.forEach((blip) => {
    blip.angle += blip.speed;
    const bx = cx + Math.cos(blip.angle) * blip.radius * outer;
    const by = cy + Math.sin(blip.angle) * blip.radius * outer;
    const pulse = 0.45 + 0.55 * Math.sin(timeMs * 0.004 + blip.pulse);

    radarCtx.beginPath();
    radarCtx.arc(bx, by, 1.6 + pulse * 2.2, 0, Math.PI * 2);
    radarCtx.fillStyle = `rgba(140, 255, 190, ${0.35 + pulse * 0.5})`;
    radarCtx.fill();
  });
}

function triggerPulse() {
  if (!window.gsap) {
    return;
  }

  gsap.fromTo(
    towerGroup.scale,
    { x: 1, y: 1, z: 1 },
    { x: 1.24, y: 1.24, z: 1.24, yoyo: true, repeat: 1, duration: 0.28, ease: "power2.inOut" }
  );

  gsap.fromTo(
    towerGroup.rotation,
    { z: 0 },
    { z: 0.12, yoyo: true, repeat: 1, duration: 0.18 }
  );

  if (bloomPass) {
    gsap.fromTo(
      bloomPass,
      { strength: 1.05 },
      { strength: 2.1, yoyo: true, repeat: 1, duration: 0.26 }
    );
  }

  pushLog("Pulse Burst executed.");
  playSound("abilityPulse");
}

function triggerEMP() {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.018, 12, 100),
    new THREE.MeshBasicMaterial({
      color: THEMES[state.theme].base,
      transparent: true,
      opacity: 0.8
    })
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.3;
  effectGroup.add(ring);

  if (window.gsap) {
    gsap.to(ring.scale, {
      x: 9,
      y: 9,
      z: 9,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => {
        effectGroup.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
      }
    });

    gsap.to(ring.material, {
      opacity: 0,
      duration: 0.8
    });
  }

  pushLog("EMP Wave deployed.");
  playSound("abilityEmp");
}

function triggerScan() {
  const sweep = new THREE.Mesh(
    new THREE.CylinderGeometry(2.35, 2.35, 0.03, 36, 1, true),
    new THREE.MeshBasicMaterial({
      color: THEMES[state.theme].base,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
  );

  sweep.position.y = -1.3;
  scene.add(sweep);

  if (window.gsap) {
    gsap.to(sweep.position, {
      y: 2.2,
      duration: 1.1,
      ease: "sine.out",
      onComplete: () => {
        scene.remove(sweep);
        sweep.geometry.dispose();
        sweep.material.dispose();
      }
    });

    gsap.to(sweep.material, {
      opacity: 0,
      duration: 1.1
    });
  }

  pushLog("Scan sweep complete.");
  playSound("abilityScan");
}

function triggerOverclock() {
  state.boost = 2.1;
  state.boostDecay = 4.5;

  if (window.gsap && rgbShiftPass) {
    gsap.to(rgbShiftPass.uniforms.amount, {
      value: 0.0028,
      duration: 0.16,
      yoyo: true,
      repeat: 1
    });
  }

  pushLog("Overclock engaged.");
  playSound("abilityOverclock");
}

abilityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const ability = button.getAttribute("data-ability");

    if (ability === "pulse") {
      triggerPulse();
    }

    if (ability === "emp") {
      triggerEMP();
    }

    if (ability === "scan") {
      triggerScan();
    }

    if (ability === "overclock") {
      triggerOverclock();
    }

    playSound("uiClick");
  });
});

let audioCtx = null;
let analyser = null;
let audioData = null;
let timeData = null;
let micStream = null;

async function enableAudioReactive() {
  if (state.audioReady) {
    state.audioReady = false;
    audioToggle.textContent = "Enable Audio Reactive";
    audioToggle.classList.remove("active");
    pushLog("Audio-reactive mode paused.");
    playSound("audioDisabled");
    return;
  }

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("MediaDevices API unavailable");
    }

    if (!audioCtx) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      analyser.minDecibels = -95;
      analyser.maxDecibels = -10;
      source.connect(analyser);
      audioData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
    }

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    state.audioReady = true;
    audioToggle.textContent = "Audio Reactive Active";
    audioToggle.classList.add("active");
    pushLog("Audio-reactive mode active. Speak or play audio near mic.");
    playSound("audioEnabled");
  } catch (error) {
    const reason = error && error.name ? error.name : "unknown-error";
    pushLog(`Mic unavailable (${reason}). Using simulated pulses.`);
    state.audioReady = false;
    playSound("audioError");
  }
}

audioToggle.addEventListener("click", enableAudioReactive);

function applyTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) {
    return;
  }

  state.theme = themeName;
  state.matrixColor = theme.matrixColor;

  Object.values(THEMES).forEach((entry) => {
    document.body.classList.remove(entry.className);
  });
  document.body.classList.add(theme.className);

  coreMaterial.color.setHex(theme.base);
  coreMaterial.emissive.setHex(theme.emissive);
  shellMaterial.color.setHex(theme.base);
  cubeMaterial.color.setHex(theme.base);
  topSpire.material.color.setHex(theme.base);

  rings.forEach((ring) => {
    ring.material.color.setHex(theme.base);
  });

  particleMaterial.color.setHex(theme.particle);

  if (Array.isArray(gridFloor.material)) {
    gridFloor.material[0].color.setHex(theme.floorMain);
    gridFloor.material[1].color.setHex(theme.floorSub);
  } else {
    gridFloor.material.color.setHex(theme.floorMain);
  }

  floorDisk.material.color.setHex(theme.floorSub);

  droneGroup.children.forEach((drone) => {
    drone.material.color.setHex(theme.base);
  });

  shardGroup.children.forEach((shard) => {
    shard.material.color.setHex(theme.particle);
  });

  mainLight.color.setHex(theme.base);
  rimLight.color.setHex(theme.particle);

  themeButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-theme") === themeName);
  });

  pushLog(`Theme changed to ${themeName.toUpperCase()}.`);
  playSound("themeSwitch");
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.getAttribute("data-theme"));
  });
});

applyTheme("matrix");
setCameraMode("orbit");
particlesEl.textContent = String(particleCount);

window.addEventListener("resize", () => {
  resizeMatrix();
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);

  if (composer) {
    composer.setSize(w, h);
  }

  if (bloomPass) {
    bloomPass.setSize(w, h);
  }
});

function updateAudioLevel(timeSeconds) {
  if (state.audioReady && analyser && audioData) {
    analyser.getByteFrequencyData(audioData);
    analyser.getByteTimeDomainData(timeData);

    let sum = 0;
    let squareSum = 0;

    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i];
    }

    for (let i = 0; i < timeData.length; i++) {
      const centered = timeData[i] - 128;
      squareSum += centered * centered;
    }

    const avgFreq = sum / audioData.length;
    const rms = Math.sqrt(squareSum / timeData.length);

    const freqLevel = avgFreq / 255;
    const rmsLevel = Math.min(1, rms / 64);

    const rawLevel = Math.max(freqLevel * 1.8, rmsLevel * 2.5);
    const gated = Math.max(0, (rawLevel - 0.02) * 1.35);
    const clamped = Math.min(1, gated);

    state.audioLevel = state.audioLevel * 0.82 + clamped * 0.18;
    return;
  }

  state.audioLevel = 0.25 + Math.sin(timeSeconds * 1.8) * 0.15;
}

function animate(time) {
  requestAnimationFrame(animate);

  const delta = time - lastTime;
  lastTime = time;
  const fps = delta > 0 ? Math.round(1000 / delta) : 60;
  state.fps = Math.max(20, Math.min(144, fps));

  drawMatrix();

  const t = time * 0.001;
  updateAudioLevel(t);

  if (state.boostDecay > 0) {
    state.boostDecay -= delta * 0.001;
    state.boost = Math.max(1, state.boost - delta * 0.0005);
  } else {
    state.boost = 1;
  }

  const sceneSpeed = state.boost + state.audioLevel * 0.9;

  if (dragState.active) {
    towerGroup.rotation.x += (dragState.targetX - towerGroup.rotation.x) * 0.26;
    towerGroup.rotation.y += (dragState.targetY - towerGroup.rotation.y) * 0.26;
  } else {
    dragState.targetX += dragState.velX * 0.45;
    dragState.targetY += dragState.velY * 0.45;
    dragState.velX *= 0.86;
    dragState.velY *= 0.86;

    dragState.targetX *= 0.94;
    dragState.targetY *= 0.985;

    towerGroup.rotation.x += (dragState.targetX - towerGroup.rotation.x) * 0.08;
    towerGroup.rotation.y += (dragState.targetY - towerGroup.rotation.y) * 0.08;
  }

  if (presentationState.active) {
    presentationState.angle += 0.0018;
    const orbitX = Math.cos(presentationState.angle) * 0.9;
    const orbitZ = 6.1 + Math.sin(presentationState.angle) * 0.75;
    camera.position.x += (orbitX - camera.position.x) * 0.03;
    camera.position.y += (1.15 - camera.position.y) * 0.03;
    camera.position.z += (orbitZ - camera.position.z) * 0.03;
  }

  camera.lookAt(0, 0.1, 0);

  towerGroup.rotation.y += 0.0039 * sceneSpeed;
  cube.rotation.x += 0.008 * sceneSpeed;
  cube.rotation.y += 0.011 * sceneSpeed;
  shell.rotation.y -= 0.006 * sceneSpeed;
  floorGroup.rotation.y -= 0.0011 * sceneSpeed;
  particles.rotation.y += 0.00032 * sceneSpeed;
  stars.rotation.y += 0.00008;

  rings.forEach((ring, index) => {
    ring.rotation.z += (0.002 + index * 0.0007) * sceneSpeed * (index % 2 === 0 ? 1 : -1);
  });

  shardGroup.children.forEach((shard, index) => {
    const speed = shard.userData.speed * sceneSpeed;
    shard.userData.angle += speed;
    shard.position.x = Math.cos(shard.userData.angle) * shard.userData.radius;
    shard.position.z = Math.sin(shard.userData.angle) * shard.userData.radius;
    shard.position.y = shard.userData.yBase + Math.sin(t * 2 + index) * 0.13;
    shard.rotation.x += 0.01;
    shard.rotation.y += 0.009;
  });

  droneGroup.children.forEach((drone, index) => {
    const orbit = t * drone.userData.speed + drone.userData.offset;
    drone.position.x = Math.cos(orbit) * drone.userData.radius;
    drone.position.z = Math.sin(orbit) * drone.userData.radius;
    drone.position.y = 0.2 + Math.sin(orbit * 2.4 + index) * 0.65;
    drone.rotation.x += 0.02;
    drone.rotation.y += 0.015;
  });

  const positions = particleGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const yIndex = i * 3 + 1;
    positions[yIndex] += Math.sin(t * 1.1 + i * 0.03) * 0.00055;
  }
  particleGeometry.attributes.position.needsUpdate = true;

  particleMaterial.size = 0.02 + state.audioLevel * 0.02;
  coreMaterial.emissiveIntensity = 0.5 + state.audioLevel * 1.4;

  if (bloomPass) {
    bloomPass.strength = 0.85 + state.audioLevel * 0.95 + (state.boost - 1) * 0.6;
  }

  if (rgbShiftPass) {
    rgbShiftPass.uniforms.amount.value = 0.00075 + state.audioLevel * 0.0012;
  }

  const energy = Math.round(Math.min(100, (state.audioLevel * 70) + (state.boost - 1) * 35 + 25));
  const micPercent = Math.round(Math.max(0, Math.min(100, state.audioLevel * 100)));
  const flux = (towerGroup.rotation.y % (Math.PI * 2)).toFixed(2);

  fpsEl.textContent = String(state.fps);
  micEl.textContent = `${micPercent}%`;
  energyEl.textContent = `${energy}%`;
  fluxEl.textContent = flux;
  statusEl.textContent = energy > 40 ? "SYNCED" : "LOW POWER";
  powerEl.style.width = `${energy}%`;

  if (time % 2700 < 18) {
    pushLog(logs[logIndex % logs.length]);
    logIndex++;
  }

  drawRadar(time);

  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate(performance.now());







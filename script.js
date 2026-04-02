console.log("Sci-fi animation started");

if (window.gsap) {
  gsap.from(".panel", {
    y: -30,
    opacity: 0,
    duration: 1.5
  });
}

const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

const letters = "01";
const fontSize = 14;
let columns = 0;

const drops = [];

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = window.devicePixelRatio || 1;

  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  columns = Math.floor(width / fontSize);
  drops.length = columns;

  for (let i = 0; i < columns; i++) {
    if (typeof drops[i] !== "number") {
      drops[i] = 1;
    }
  }
}

function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  ctx.fillStyle = "#00ff00";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = letters[Math.floor(Math.random() * letters.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }

    drops[i]++;
  }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function animate() {
  draw();
  requestAnimationFrame(animate);
}

animate();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById("three-container").appendChild(renderer.domElement);

// Cube (your "square" but 3D)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 3;

// 🖱️ Mouse drag rotation
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

window.addEventListener("mousedown", (e) => {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener("mouseup", () => {
  isDragging = false;
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const deltaX = e.clientX - previousMousePosition.x;
  const deltaY = e.clientY - previousMousePosition.y;

  cube.rotation.y += deltaX * 0.01;
  cube.rotation.x += deltaY * 0.01;

  previousMousePosition = {
    x: e.clientX,
    y: e.clientY
  };
});

// Render loop
function animate3D() {
  requestAnimationFrame(animate3D);
  renderer.render(scene, camera);
}

animate3D();
console.log("Sci-fi animation started");

if (window.gsap) {
  gsap.from(".glow", {
    y: 100,
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
const canvas = document.querySelector("#particle-network");
const ctx = canvas?.getContext("2d", { alpha: true });
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0, active: false };
let particles = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

function particleCount() {
  if (width < 720) return 760;
  if (width < 1100) return 1200;
  return 1900;
}

function resize() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = rect.width;
  height = rect.height;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const total = particleCount();
  particles = Array.from({ length: total }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.14,
    vy: (Math.random() - 0.5) * 0.14,
    r: Math.random() * 1.25 + 0.25,
    phase: Math.random() * Math.PI * 2
  }));
}

function moveParticle(p, time) {
  const drift = Math.sin(time * 0.00025 + p.phase) * 0.045;
  p.x += p.vx + drift;
  p.y += p.vy + Math.cos(time * 0.0002 + p.phase) * 0.035;

  if (pointer.active) {
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 170 && distance > 0.001) {
      const force = (170 - distance) / 170;
      p.x += (dx / distance) * force * 1.15;
      p.y += (dy / distance) * force * 1.15;
    }
  }

  if (p.x < -20) p.x = width + 20;
  if (p.x > width + 20) p.x = -20;
  if (p.y < -20) p.y = height + 20;
  if (p.y > height + 20) p.y = -20;
}

function drawConnections(sample) {
  ctx.lineWidth = 1;
  for (let i = 0; i < sample.length; i += 1) {
    const a = sample[i];
    for (let j = i + 1; j < sample.length; j += 1) {
      const b = sample[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 92) {
        ctx.strokeStyle = `rgba(124, 131, 253, ${0.09 * (1 - distance / 92)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

function draw(time = 0) {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(width * 0.58, height * 0.35, 0, width * 0.58, height * 0.35, Math.max(width, height) * 0.68);
  gradient.addColorStop(0, "rgba(124, 131, 253, 0.12)");
  gradient.addColorStop(1, "rgba(5, 8, 22, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const connectionSample = [];
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];
    if (!reducedMotion) moveParticle(p, time);
    if (i % 8 === 0) connectionSample.push(p);

    const alpha = 0.22 + Math.sin(time * 0.001 + p.phase) * 0.08;
    ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawConnections(connectionSample);
  requestAnimationFrame(draw);
}

function revealOnScroll() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.16 });

  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
}

window.addEventListener("resize", resize, { passive: true });
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
}, { passive: true });
window.addEventListener("pointerleave", () => {
  pointer.active = false;
}, { passive: true });

if (canvas && ctx) {
  resize();
  requestAnimationFrame(draw);
}

revealOnScroll();

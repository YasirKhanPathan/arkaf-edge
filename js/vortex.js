/* Hero realtime vortex — particle nebula with a glowing eye */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, DPR = 1;
  let cx = 0, cy = 0;
  let particles = [];
  let sparks = [];
  let raf = null, running = true;
  let t = 0;
  let light = false;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W * 0.545;
    cy = H * 0.5;
    seed();
  }

  function radiusMax() { return Math.max(W, H) * 0.62; }

  function seed() {
    const count = Math.round(Math.min(3000, Math.max(1100, (W * H) / 640)));
    particles = [];
    for (let i = 0; i < count; i++) particles.push(makeP(true));
    sparks = [];
    for (let i = 0; i < 26; i++) {
      sparks.push({
        r: radiusMax() * (0.18 + Math.random() * 0.8),
        a: Math.random() * Math.PI * 2,
        s: 0.0016 + Math.random() * 0.0035,
        size: 0.6 + Math.random() * 1.2,
        hue: 145 + Math.random() * 18
      });
    }
  }

  function makeP(anywhere) {
    const rMax = radiusMax();
    const r = anywhere ? Math.pow(Math.random(), 0.62) * rMax : rMax * (0.75 + Math.random() * 0.3);
    return {
      r: r,
      a: Math.random() * Math.PI * 2,
      speed: (0.0016 + Math.random() * 0.0026) * (1 + 90 / (r + 60)),
      drift: (Math.random() - 0.5) * 0.0007,
      size: 0.4 + Math.random() * 1.3,
      alpha: 0.12 + Math.random() * 0.7,
      wob: Math.random() * Math.PI * 2,
      wobS: 0.004 + Math.random() * 0.01,
      squash: 0.72 + Math.random() * 0.5
    };
  }

  function draw() {
    if (!running) return;
    t += 1;
    light = document.documentElement.dataset.theme === 'light';

    // trail fade
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = light ? 'rgba(238, 247, 246, 0.30)' : 'rgba(2, 9, 7, 0.30)';
    ctx.fillRect(0, 0, W, H);

    // nebula wash
    const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusMax() * 0.85);
    if (light) {
      g0.addColorStop(0, 'rgba(4, 140, 92, 0.07)');
      g0.addColorStop(0.45, 'rgba(3, 110, 72, 0.04)');
      g0.addColorStop(1, 'rgba(3, 90, 60, 0)');
    } else {
      g0.addColorStop(0, 'rgba(4, 60, 40, 0.10)');
      g0.addColorStop(0.45, 'rgba(3, 40, 28, 0.055)');
      g0.addColorStop(1, 'rgba(1, 8, 6, 0)');
    }
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, W, H);

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const ox = cx + mouse.x * 26;
    const oy = cy + mouse.y * 18;

    // particles (spiral streaks)
    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a0 = p.a;
      p.a += p.speed;
      p.r -= 0.42 + (60 / (p.r + 90)) * 0.6;
      p.wob += p.wobS;
      if (p.r < 6) { particles[i] = makeP(false); continue; }

      const rr = p.r * (1 + Math.sin(p.wob) * 0.05);
      const x = ox + Math.cos(p.a) * rr;
      const y = oy + Math.sin(p.a) * rr * 0.74 * p.squash;
      const px = ox + Math.cos(a0) * rr;
      const py = oy + Math.sin(a0) * rr * 0.74 * p.squash;

      const edge = 1 - Math.min(1, rr / radiusMax());
      const core = Math.min(1, 34 / rr);
      const alpha = p.alpha * (0.16 + edge * 0.55 + core * 0.5);
      if (alpha <= 0.01 || x < -80 || x > W + 80 || y < -80 || y > H + 80) continue;

      const hot = core > 0.45;
      if (light) {
        ctx.strokeStyle = hot
          ? 'rgba(2, 46, 32,' + (alpha * 0.85).toFixed(3) + ')'
          : 'rgba(4, 96, 64,' + (alpha * 0.8).toFixed(3) + ')';
      } else {
        ctx.strokeStyle = hot
          ? 'rgba(180, 255, 224,' + (alpha * 0.9).toFixed(3) + ')'
          : 'rgba(24, 214, 138,' + alpha.toFixed(3) + ')';
      }
      ctx.lineWidth = p.size * (0.7 + core * 1.5);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // bright orbiting sparks
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.a += s.s;
      s.r -= 0.28;
      if (s.r < 12) { s.r = radiusMax() * (0.6 + Math.random() * 0.5); s.a = Math.random() * Math.PI * 2; }
      const x = ox + Math.cos(s.a) * s.r;
      const y = oy + Math.sin(s.a) * s.r * 0.76;
      const rr = s.size * 6;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, rr);
      if (light) {
        gg.addColorStop(0, 'rgba(2,90,58,0.55)');
        gg.addColorStop(0.3, 'rgba(3,140,90,0.22)');
        gg.addColorStop(1, 'rgba(3,160,100,0)');
      } else {
        gg.addColorStop(0, 'rgba(120,255,205,0.62)');
        gg.addColorStop(0.3, 'rgba(20,220,140,0.24)');
        gg.addColorStop(1, 'rgba(10,180,110,0)');
      }
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    // glowing eye — dark core with bright rim
    const eyeR = Math.max(70, Math.min(W, H) * 0.135);
    const rimPulse = 1 + Math.sin(t * 0.02) * 0.05;
    const core = ctx.createRadialGradient(ox, oy, eyeR * 0.1, ox, oy, eyeR * 1.5);
    if (light) {
      core.addColorStop(0, 'rgba(244,252,249,0.96)');
      core.addColorStop(0.55, 'rgba(236,247,243,0.9)');
      core.addColorStop(0.78, 'rgba(150,225,195,0.4)');
      core.addColorStop(1, 'rgba(90,200,160,0)');
    } else {
      core.addColorStop(0, 'rgba(0,0,0,0.96)');
      core.addColorStop(0.55, 'rgba(1,10,7,0.9)');
      core.addColorStop(0.78, 'rgba(4,70,46,0.42)');
      core.addColorStop(1, 'rgba(4,120,78,0)');
    }
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(ox, oy, eyeR * 1.5 * rimPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = light ? 'rgba(3,150,95,0.42)' : 'rgba(80,255,190,0.42)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ox, oy, eyeR * 0.92 * rimPulse, -0.6, 2.4);
    ctx.stroke();
    ctx.strokeStyle = light ? 'rgba(3,150,95,0.2)' : 'rgba(20,200,130,0.22)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(ox, oy, eyeR * 1.02 * rimPulse, 0.4, 3.6);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(draw);
  }

  function start() { if (!raf && running) raf = requestAnimationFrame(draw); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const io = new IntersectionObserver(function (entries) {
    running = entries[0].isIntersecting;
    if (running) start(); else stop();
  }, { threshold: 0.02 });
  io.observe(canvas);

  resize();
  ctx.fillStyle = document.documentElement.dataset.theme === 'light' ? '#eef7f6' : '#020907';
  ctx.fillRect(0, 0, W, H);
  if (!reduced) start(); else { draw(); stop(); }
})();

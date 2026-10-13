/* Approach section — realtime particle wave terrain */
(function () {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  let W = 0, H = 0, DPR = 1;
  let raf = null, running = true, t = 0;
  let light = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLS = 120;      // points across a row (screen space)
  const ROWS = 54;       // depth rows
  const Z_NEAR = 3.2;
  const Z_FAR = 46;
  const CAM_Y = 1.55;
  const bokeh = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bokeh.length = 0;
    for (let i = 0; i < 40; i++) {
      bokeh.push({
        x: Math.random() * W,
        y: H * (0.42 + Math.random() * 0.58),
        r: 2.5 + Math.random() * 11,
        sp: 0.12 + Math.random() * 0.5,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  function height(x, z, time) {
    const a = Math.sin(x * 0.34 + time * 0.9) * 0.5;
    const b = Math.sin(z * 0.42 - time * 1.15) * 0.5;
    const c = Math.sin((x + z) * 0.23 + time * 0.6) * 0.45;
    const d = Math.sin(x * 0.11 - z * 0.17 + time * 0.35) * 0.8;
    return (a + b + c + d) * 0.34;
  }

  function draw() {
    if (!running) return;
    t += 0.016;
    light = document.documentElement.dataset.theme === 'light';

    // backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    if (light) {
      bg.addColorStop(0, '#e9f6f1');
      bg.addColorStop(0.55, '#ddf2ea');
      bg.addColorStop(1, '#e4f4ee');
    } else {
      bg.addColorStop(0, '#02130f');
      bg.addColorStop(0.55, '#03251d');
      bg.addColorStop(1, '#021a14');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5;
    const horizon = H * 0.40;
    const f = Math.max(W, H) * 0.9;

    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';

    // soft glow behind the horizon
    const glow = ctx.createRadialGradient(cx, horizon + H * 0.26, 0, cx, horizon + H * 0.26, W * 0.62);
    if (light) {
      glow.addColorStop(0, 'rgba(10, 170, 112, 0.16)');
      glow.addColorStop(0.5, 'rgba(8, 130, 86, 0.08)');
      glow.addColorStop(1, 'rgba(5, 90, 60, 0)');
    } else {
      glow.addColorStop(0, 'rgba(9, 150, 100, 0.34)');
      glow.addColorStop(0.5, 'rgba(6, 90, 62, 0.16)');
      glow.addColorStop(1, 'rgba(3, 40, 28, 0)');
    }
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // depth rows: far -> near (screen-space columns, perspective wave)
    const colStep = (W + 60) / (COLS - 1);
    for (let ri = 0; ri < ROWS; ri++) {
      const k = ri / (ROWS - 1);
      const z = Z_FAR * Math.pow(Z_NEAR / Z_FAR, k);           // geometric depth
      const scale = f / z;
      const depth = 1 - k;                                       // 0 near, 1 far
      const yBase = horizon + CAM_Y * scale;
      const amp = 30 + depth * depth * 150;                      // screen-space wave amplitude
      const xOff = (ri & 1) * colStep * 0.5;                     // stagger odd rows

      for (let ci = 0; ci < COLS; ci++) {
        const sx = -30 + xOff + ci * colStep;
        const wx = (sx - cx) / scale;                            // back-project to world x
        const h = height(wx * 0.8, z, t);
        const sy = yBase - h * amp;
        if (sy < -20 || sy > H + 20) continue;

        const lift = (h + 1.1) / 2.2;                            // 0..1
        const alpha = (0.16 + depth * 0.58) * (0.5 + lift * 0.85);
        const size = Math.max(0.6, (0.9 + (1 - depth) * 1.5) * (0.7 + lift * 0.6));

        if (light) {
          if (lift > 0.86) {
            ctx.fillStyle = 'rgba(2, 70, 46,' + Math.min(0.9, alpha * 1.4).toFixed(3) + ')';
          } else if (lift > 0.66) {
            ctx.fillStyle = 'rgba(3, 120, 78,' + Math.min(0.85, alpha * 1.2).toFixed(3) + ')';
          } else {
            ctx.fillStyle = 'rgba(5, 150, 98,' + Math.min(0.75, alpha).toFixed(3) + ')';
          }
        } else {
          if (lift > 0.86) {
            ctx.fillStyle = 'rgba(190, 255, 225,' + Math.min(0.9, alpha * 1.5).toFixed(3) + ')';
          } else if (lift > 0.66) {
            ctx.fillStyle = 'rgba(60, 235, 165,' + Math.min(0.8, alpha * 1.25).toFixed(3) + ')';
          } else {
            ctx.fillStyle = 'rgba(16, 190, 125,' + Math.min(0.7, alpha).toFixed(3) + ')';
          }
        }
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // drifting bokeh dots
    for (let i = 0; i < bokeh.length; i++) {
      const b = bokeh[i];
      b.y -= b.sp;
      b.x += Math.sin(t * 0.6 + b.ph) * 0.35;
      if (b.y < -30) { b.y = H + 30; b.x = Math.random() * W; }
      const rr = b.r * 2.8;
      const gg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rr);
      if (light) {
        gg.addColorStop(0, 'rgba(3, 130, 85, 0.34)');
        gg.addColorStop(0.35, 'rgba(4, 160, 105, 0.14)');
        gg.addColorStop(1, 'rgba(5, 180, 118, 0)');
      } else {
        gg.addColorStop(0, 'rgba(90, 255, 200, 0.5)');
        gg.addColorStop(0.35, 'rgba(20, 220, 145, 0.2)');
        gg.addColorStop(1, 'rgba(10, 160, 100, 0)');
      }
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(b.x, b.y, rr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(draw);
  }

  function start() { if (!raf && running) raf = requestAnimationFrame(draw); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  window.addEventListener('resize', resize);
  const io = new IntersectionObserver(function (e) {
    running = e[0].isIntersecting;
    if (running) start(); else stop();
  }, { threshold: 0.02 });
  io.observe(canvas);

  resize();
  draw();
  if (reduced) stop();
})();

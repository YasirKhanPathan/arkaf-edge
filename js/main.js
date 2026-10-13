/* =========================================================
   ARKAF EDGE. — interactions
   Lenis smooth scroll + GSAP ScrollTrigger choreography
   ========================================================= */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const docEl = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------- smooth scroll ---------------- */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  function scrollTo(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    lenis.scrollTo(el, { offset: -8, duration: 1.4 });
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (a.hasAttribute('data-menu-link')) closeMenu();
      scrollTo(el);
    });
  });

  /* ---------------- custom cursor ---------------- */
  const cursor = document.getElementById('cursor');
  if (cursor && !isTouch) {
    let x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y, on = false;
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; cursor.classList.add('is-on'); x = tx; y = ty; }
    }, { passive: true });
    window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cursor.classList.remove('is-on'); });
    gsap.ticker.add(() => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      cursor.style.transform = 'translate(' + (x - 35) + 'px,' + (y - 35) + 'px)';
    });
    const hoverSel = 'a, button, input, textarea, .stat, .case-card, .post-card, .btn, .phenom-card';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSel)) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSel)) cursor.classList.remove('is-hover');
    });
  }

  /* ---------------- menu ---------------- */
  const menuBtn = document.getElementById('menuBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    menuOverlay.classList.add('is-open');
    menuOverlay.setAttribute('aria-hidden', 'false');
    menuBtn.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    docEl.classList.add('is-locked');
    lenis.stop();
  }
  function closeMenu() {
    menuOpen = false;
    menuOverlay.classList.remove('is-open');
    menuOverlay.setAttribute('aria-hidden', 'true');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    docEl.classList.remove('is-locked');
    lenis.start();
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
  }

  /* ---------------- theme ---------------- */
  const themeToggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('arkaf-theme');
  if (stored === 'light' || stored === 'dark') docEl.dataset.theme = stored;
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = docEl.dataset.theme === 'light' ? 'dark' : 'light';
      docEl.dataset.theme = next;
      localStorage.setItem('arkaf-theme', next);
      if (next === 'light') document.getElementById('siteHeader').classList.remove('is-light');
      ScrollTrigger.refresh();
    });
  }

  /* ---------------- hero intro ---------------- */
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .from('.hero .chip-dark', { y: 24, opacity: 0, duration: 0.8 }, 0.15)
    .from('.hero-title .line-in', { yPercent: 112, duration: 1.1, stagger: 0.1 }, 0.25)
    .from('.hero-lead', { y: 26, opacity: 0, duration: 0.9 }, 0.62)
    .from('.hero-actions', { y: 26, opacity: 0, duration: 0.9 }, 0.74)
    .from('.hero-foot .mono-label', { y: 16, opacity: 0, duration: 0.8, stagger: 0.08 }, 0.9)
    .from('.site-header', { y: -26, opacity: 0, duration: 0.9 }, 0.05)
    .set('.hero-title .line', { overflow: 'visible' }, 2.1);

  /* hero parallax out */
  gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  })
    .to('.hero-inner', { y: -90, opacity: 0.15, ease: 'none' }, 0)
    .to('.hero-foot', { opacity: 0, ease: 'none' }, 0)
    .to('.hero-canvas', { scale: 1.12, opacity: 0.35, ease: 'none' }, 0);

  /* ---------------- generic reveals ---------------- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, {
      y: 34, opacity: 0, duration: 0.95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* masked line headings (non-hero) */
  gsap.utils.toArray('.section-title').forEach((title) => {
    const lines = title.querySelectorAll('.line-in');
    if (!lines.length || title.closest('.hero')) return;
    gsap.from(lines, {
      yPercent: 112, duration: 1.05, ease: 'power4.out', stagger: 0.09,
      scrollTrigger: { trigger: title, start: 'top 88%', once: true }
    });
  });

  /* =========================================================
     SERVICES — pinned flower + sequential reveal
     ========================================================= */
  const servicesTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.services-wrap',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6
    }
  });

  servicesTl
    .fromTo('.flower',
      { scale: 0.84, rotate: -9, opacity: 0.25, filter: 'brightness(0.4) saturate(0.6)' },
      { scale: 1, rotate: 7, opacity: 1, filter: 'brightness(1.06) saturate(1.15)', ease: 'none', duration: 1 }, 0)
    .fromTo('.service-a', { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.04)
    .fromTo('.service-b', { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.22)
    .fromTo('.service-c', { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.44)
    .fromTo('.service-d', { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.62)
    .to('.flower', { scale: 1.06, rotate: 12, duration: 0.38, ease: 'none' }, 0.62);

  /* =========================================================
     PHENOMENON — horizontal scroll + header theme flip
     ========================================================= */
  const track = document.getElementById('phenomTrack');
  let trackOverflow = 0;

  function measureTrack() {
    if (!track) return;
    const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    trackOverflow = Math.max(0, track.scrollWidth - window.innerWidth + pad);
  }
  measureTrack();

  ScrollTrigger.addEventListener('refreshInit', measureTrack);

  if (track) {
    ScrollTrigger.create({
      trigger: '.phenomenon-wrap',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        gsap.set(track, { x: -trackOverflow * self.progress });
      }
    });
    gsap.from('.phenom-card', {
      y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: '.phenomenon-wrap', start: 'top 70%', once: true }
    });
  }

  /* header goes light while the white panel is behind it */
  ScrollTrigger.create({
    trigger: '.phenomenon-wrap',
    start: 'top 72px',
    end: 'bottom 72px',
    onToggle: (self) => {
      if (docEl.dataset.theme === 'light') return;
      document.getElementById('siteHeader').classList.toggle('is-light', self.isActive);
    }
  });

  /* =========================================================
     APPROACH — step machine
     ========================================================= */
  const STEPS = [
    {
      label: '01 — THINK',
      preview: 'VISUAL PREVIEW 01',
      sub: '01 — THINK',
      title: 'Understand the business, audience, market, and opportunity.',
      body: 'We analyze the business, audience, and market opportunity to define a strategy that creates lasting differentiation and stakeholder alignment.',
      side: 'right'
    },
    {
      label: '02 — CREATE',
      preview: 'VISUAL PREVIEW 02',
      sub: '02 — CREATE',
      title: 'Turn insight into strategies, ideas, identities, and experiences.',
      body: 'We turn strategic insight into compelling visual identities, campaigns, digital experiences, and communications people trust and use.',
      side: 'left'
    },
    {
      label: '03 — TRANSFORM',
      preview: 'VISUAL PREVIEW 03',
      sub: '03 — TRANSFORM',
      title: 'Launch, evolve, and create measurable impact.',
      body: 'We launch, evolve, and execute marketing systems for predictable, scalable, long-term business growth.',
      side: 'right'
    }
  ];

  const stepCard = document.getElementById('stepCard');
  const words = gsap.utils.toArray('.aword');
  let currentStep = -1;
  let stepLocked = false;

  function setStep(i, immediate) {
    if (i === currentStep) return;
    currentStep = i;
    const s = STEPS[i];

    words.forEach((w, wi) => w.classList.toggle('is-active', wi === i));
    stepCard.classList.toggle('is-left', s.side === 'left');

    const apply = () => {
      document.getElementById('previewTitle').textContent = s.preview;
      document.getElementById('previewSub').textContent = s.sub;
      document.getElementById('stepLabel').innerHTML = '<i class="dot-green"></i>' + s.label;
      document.getElementById('stepTitle').textContent = s.title;
      document.getElementById('stepBody').textContent = s.body;
    };

    if (immediate) { apply(); gsap.set(stepCard, { opacity: 1, yPercent: -50 }); return; }

    stepLocked = true;
    gsap.timeline({ onComplete: () => { stepLocked = false; } })
      .to(stepCard, { opacity: 0, y: 18, duration: 0.24, ease: 'power2.in' })
      .add(apply)
      .to(stepCard, { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' });
  }

  if (stepCard) {
    gsap.set(stepCard, { yPercent: -50, opacity: 0, y: 30 });
    ScrollTrigger.create({
      trigger: '.approach-wrap',
      start: 'top 60%',
      once: true,
      onEnter: () => gsap.to(stepCard, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
    });

    ScrollTrigger.create({
      trigger: '.approach-wrap',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress;
        const idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
        if (!stepLocked) setStep(idx);
      },
      onEnter: () => setStep(0, currentStep === -1),
      onEnterBack: () => setStep(2)
    });

    gsap.timeline({
      scrollTrigger: { trigger: '.approach-wrap', start: 'top top', end: 'bottom bottom', scrub: 0.5 }
    }).fromTo('.approach-words', { y: 30 }, { y: -30, ease: 'none' }, 0);

    setStep(0, true);
    gsap.set(stepCard, { opacity: 0, y: 30 });
  }

  /* =========================================================
     STATS count-up
     ========================================================= */
  gsap.utils.toArray('.stat-num[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end, duration: 1.6, ease: 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
    });
  });

  /* =========================================================
     misc
     ========================================================= */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = document.getElementById('formNote');
      const email = form.querySelector('[name="email"]');
      const name = form.querySelector('[name="name"]');
      if (!name.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        note.textContent = 'PLEASE ADD YOUR NAME AND A VALID EMAIL.';
        note.style.color = '#ff8f6b';
        return;
      }
      note.style.color = '';
      note.textContent = 'MESSAGE SENT — WE WILL BE IN TOUCH SHORTLY.';
      form.reset();
    });
  }

  /* refresh after assets load */
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* expose for debugging */
  window.arkaf = { lenis, scrollTo };
})();

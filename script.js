(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  const finishLoading = () => {
    if (body.classList.contains('is-loaded')) return;
    body.classList.add('is-loaded');
    body.classList.remove('is-loading');
  };
  window.addEventListener('load', () => setTimeout(finishLoading, reduceMotion ? 0 : 1300));
  setTimeout(finishLoading, 3500); // safety net

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Nav, progress bar, floating button ---------- */
  const nav = $('.nav');
  const progress = $('.progress');
  const floatBook = $('.float-book');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 500 && !body.classList.contains('menu-open'));
    floatBook.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    lastY = y;
    parallax();
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Parallax ---------- */
  const parallaxEls = $$('[data-parallax]');
  function parallax() {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const speed = parseFloat(el.dataset.parallax);
      const offset = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${-offset}px, 0)`;
    });
  }
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav__toggle');
  const menu = $('.menu');
  const setMenu = open => {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
  };
  toggle.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav__links a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sectionObserver.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealObserver.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  const observeReveal = (els) => {
    // stagger siblings that enter together
    els.forEach((el, i) => {
      if (!el.style.transitionDelay) {
        const siblings = [...el.parentElement.children].filter(c => c.matches('.reveal, .reveal-up, .service, .gallery__item'));
        const idx = siblings.indexOf(el);
        if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 0.08}s`;
      }
      revealObserver.observe(el);
    });
  };
  observeReveal($$('.reveal, .reveal-up'));

  // Clip-path masked elements count as invisible to IntersectionObserver,
  // so watch their (unclipped) parent and reveal the mask from there.
  const maskObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      $$(':scope > .reveal-mask', e.target).forEach((m, i) => {
        m.style.transitionDelay = `${i * 0.2}s`;
        m.classList.add('is-in');
      });
      maskObserver.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  new Set($$('.reveal-mask').map(m => m.parentElement)).forEach(p => maskObserver.observe(p));

  /* ---------- Services: reveal + filter ---------- */
  const services = $$('.service');
  services.forEach((s, i) => { s.style.transitionDelay = `${(i % 3) * 0.1}s`; revealObserver.observe(s); });

  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('.filter').forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', b === btn); });
    let shown = 0;
    services.forEach(s => {
      const match = f === 'all' || s.dataset.cat.split(' ').includes(f);
      s.classList.remove('is-in');
      s.classList.toggle('is-hidden', !match);
      if (match) {
        s.style.transitionDelay = `${shown * 0.06}s`;
        shown++;
        requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('is-in')));
      }
    });
  }));

  /* ---------- Reviews slider ---------- */
  const reviews = $$('.review');
  const dots = $$('.reviews__dots button');
  let current = 0;
  let timer;
  const showReview = i => {
    current = (i + reviews.length) % reviews.length;
    reviews.forEach((r, j) => r.classList.toggle('is-active', j === current));
    dots.forEach((d, j) => {
      d.classList.remove('is-active');
      if (j === current) { void d.offsetWidth; d.classList.add('is-active'); }
    });
    clearTimeout(timer);
    timer = setTimeout(() => showReview(current + 1), 6000);
  };
  dots.forEach((d, i) => d.addEventListener('click', () => showReview(i)));
  showReview(0);

  /* ---------- Gallery ---------- */
  const TOTAL = 45;
  const PAGE = 15;
  const grid = $('#galleryGrid');
  const moreBtn = $('#galleryMore');
  const photos = Array.from({ length: TOTAL }, (_, i) => `images/gallery/${String(i + 1).padStart(2, '0')}.jpg`);
  let loaded = 0;

  const loadMore = () => {
    const batch = photos.slice(loaded, loaded + PAGE);
    const items = batch.map((src, k) => {
      const idx = loaded + k;
      const btn = document.createElement('button');
      btn.className = 'gallery__item';
      btn.setAttribute('aria-label', `Open photo ${idx + 1} of ${TOTAL}`);
      btn.style.transitionDelay = `${(k % 4) * 0.08}s`;
      btn.innerHTML = `<img src="${src}" alt="Shantl &amp; Co Barber Shop photo ${idx + 1}" loading="lazy" />`;
      btn.addEventListener('click', () => openLightbox(idx));
      grid.appendChild(btn);
      return btn;
    });
    items.forEach(el => revealObserver.observe(el));
    loaded += batch.length;
    if (loaded >= TOTAL) moreBtn.parentElement.style.display = 'none';
  };
  moreBtn.addEventListener('click', loadMore);
  loadMore();

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const lbImg = $('img', lb);
  const lbCount = $('.lightbox__count', lb);
  let lbIndex = 0;
  let lastFocus = null;

  function setLightbox(i) {
    lbIndex = (i + TOTAL) % TOTAL;
    lbImg.classList.add('is-swapping');
    const next = new Image();
    next.onload = () => {
      lbImg.src = next.src;
      lbImg.alt = `Shantl & Co Barber Shop photo ${lbIndex + 1}`;
      lbImg.classList.remove('is-swapping');
    };
    next.src = photos[lbIndex];
    lbCount.textContent = `${lbIndex + 1} / ${TOTAL}`;
  }
  function openLightbox(i) {
    lastFocus = document.activeElement;
    setLightbox(i);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    body.classList.add('lb-open');
    $('.lightbox__close').focus();
  }
  function closeLightbox() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    body.classList.remove('lb-open');
    if (lastFocus) lastFocus.focus();
  }
  $('.lightbox__close').addEventListener('click', closeLightbox);
  $('.lightbox__prev').addEventListener('click', () => setLightbox(lbIndex - 1));
  $('.lightbox__next').addEventListener('click', () => setLightbox(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (lb.classList.contains('is-open')) closeLightbox(); else setMenu(false); }
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft') setLightbox(lbIndex - 1);
    if (e.key === 'ArrowRight') setLightbox(lbIndex + 1);
  });
  // swipe
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) setLightbox(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Open / closed status (New York time) ---------- */
  const HOURS = { 0: [600, 1020], 1: [540, 1140], 2: [540, 1140], 3: [540, 1140], 4: [540, 1140], 5: [540, 1140], 6: [540, 1080] };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmt = m => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`; };
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = DAYS.indexOf(get('weekday'));
    const mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
    $(`#hours li[data-day="${day}"]`)?.classList.add('is-today');
    const [open, close] = HOURS[day];
    const status = $('#openStatus');
    const label = $('.label', status);
    if (mins >= open && mins < close) {
      status.classList.add('is-open');
      label.textContent = `Open now · until ${fmt(close)}`;
    } else {
      status.classList.add('is-closed');
      const nextDay = mins < open ? day : (day + 1) % 7;
      label.textContent = `Closed · opens ${mins < open ? 'today' : DAYS[nextDay]} ${fmt(HOURS[nextDay][0])}`;
    }
  } catch (_) { /* leave default */ }

  /* ---------- Magnetic buttons ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
        btn.firstElementChild.style.transform = `translate(${x * 0.1}px, ${y * 0.12}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.firstElementChild.style.transform = '';
      });
    });
  }
})();

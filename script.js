/* Clínica de Olhos Dr. Moacir Cunha — interações L2 (IntersectionObserver + CSS, sem libs) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* ── Header sticky state via sentinela (sem listener de scroll) ── */
  var hdr = document.getElementById('hdr'), sentinel = document.getElementById('sentinel');
  if (hdr && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      hdr.classList.toggle('is-stuck', !e[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ── Menu mobile ── */
  var burger = document.getElementById('burger'), mm = document.getElementById('mobileMenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mm.classList.toggle('is-open', open);
    if (open) { mm.removeAttribute('inert'); } else { mm.setAttribute('inert', ''); }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && mm) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    mm.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    });
  }

  /* ── Reveal on scroll ── */
  var revealables = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { ro.observe(el); });
  }

  /* ── Contadores ── */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var start = null, dur = 1200;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ── Spotlight nos cards (rAF-throttled) ── */
  if (canHover) {
    var spotQueued = false, spotEvt = null;
    document.addEventListener('pointermove', function (e) {
      spotEvt = e;
      if (spotQueued) return;
      spotQueued = true;
      requestAnimationFrame(function () {
        spotQueued = false;
        var card = spotEvt.target && spotEvt.target.closest ? spotEvt.target.closest('.spot') : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (spotEvt.clientX - r.left) + 'px');
        card.style.setProperty('--my', (spotEvt.clientY - r.top) + 'px');
      });
    }, { passive: true });
  }

  /* ── Ímã no CTA do hero ── */
  if (canHover && !reduce) {
    document.querySelectorAll('.magnet').forEach(function (btn) {
      var queued = false, ev = null;
      btn.addEventListener('pointermove', function (e) {
        ev = e;
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          var r = btn.getBoundingClientRect();
          var dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
          var dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
          btn.style.transform = 'translate(' + (dx * 6).toFixed(2) + 'px,' + (dy * 5 - 2).toFixed(2) + 'px)';
        });
      }, { passive: true });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ── Parallax sutil no hero (rAF) ── */
  var heroImg = document.getElementById('heroImg');
  if (heroImg && !reduce && window.innerWidth >= 900) {
    var pQueued = false;
    window.addEventListener('scroll', function () {
      if (pQueued) return;
      pQueued = true;
      requestAnimationFrame(function () {
        pQueued = false;
        var y = Math.min(window.scrollY, 600);
        heroImg.style.transform = 'translateY(' + (y * -0.055).toFixed(1) + 'px)';
      });
    }, { passive: true });
  }

  /* ── Accordion ── */
  document.querySelectorAll('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      var group = btn.closest('.acc');
      if (group) group.querySelectorAll('.acc__btn').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        b.closest('.acc__item').classList.remove('is-open');
      });
      btn.setAttribute('aria-expanded', String(!open));
      btn.closest('.acc__item').classList.toggle('is-open', !open);
    });
  });
  /* estado inicial do accordion */
  document.querySelectorAll('.acc__btn[aria-expanded="true"]').forEach(function (b) {
    b.closest('.acc__item').classList.add('is-open');
  });

  /* ── Nav ativa por seção ── */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (targets.length && 'IntersectionObserver' in window) {
    var no = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { no.observe(t); });
  }

  /* ── Formulário (sem endpoint real — placeholder) ── */
  var form = document.getElementById('form'), note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      note.textContent = 'PLACEHOLDER: formulário sem back-end configurado. Enquanto isso, fale pelo WhatsApp 11 3016-9900.';
    });
  }

  /* ── Ovo de páscoa: o símbolo da marca gira e conta a idade ── */
  var logo = document.querySelector('.hdr__logo'), egg = document.getElementById('egg');
  if (logo && egg) {
    logo.addEventListener('click', function (e) {
      if (window.scrollY < 10) {
        e.preventDefault();
        logo.classList.add('spin');
        egg.textContent = 'Cuidando dos olhos de São Paulo desde 1940.';
        egg.classList.add('is-on');
        setTimeout(function () { logo.classList.remove('spin'); }, 700);
        setTimeout(function () { egg.classList.remove('is-on'); }, 3200);
      }
    });
  }
})();

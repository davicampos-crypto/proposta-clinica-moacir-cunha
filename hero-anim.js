/* Animação de background do hero — canvas 2D, sem dependências.
   Respeita prefers-reduced-motion, pausa fora da viewport e em aba oculta. */
(function () {
  'use strict';

  /* Em apps React/Next, inserir o canvas antes da hidratação causa mismatch e o
     React descarta o nó. Espera a hidratação terminar antes de montar. */
  function ready(cb) {
    var done = false;
    function go() { if (done) return; done = true; cb(); }
    var isReactApp = !!(self.__next_f || document.querySelector('script[src*="/_next/"]'));
    if (!isReactApp) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
      else go();
      return;
    }
    var tries = 0;
    (function poll() {
      var host = document.querySelector('main') || document.body;
      var hydrated = host && Object.keys(host).some(function (k) { return k.indexOf('__react') === 0; });
      if (hydrated) { setTimeout(go, 60); return; }
      if (++tries > 120) return go();
      setTimeout(poll, 50);
    })();
  }

  function boot() {
  var HERO = document.querySelector('.hero');
  if (!HERO || HERO.querySelector('canvas[data-hero-anim]')) return;
  var ctxTest = document.createElement('canvas').getContext && true;
  if (!ctxTest) return;

  var kids = Array.prototype.slice.call(HERO.children);
  if (getComputedStyle(HERO).position === 'static') HERO.style.position = 'relative';
  kids.forEach(function (el) {
    var p = getComputedStyle(el).position;
    if (p === 'absolute' || p === 'fixed') return;
    if (p === 'static') el.style.position = 'relative';
    if (getComputedStyle(el).zIndex === 'auto') el.style.zIndex = '2';
  });

  var cv = document.createElement('canvas');
  cv.setAttribute('data-hero-anim', '');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;display:block;z-index:0;pointer-events:none';
  HERO.insertBefore(cv, HERO.firstChild);

  var ctx = cv.getContext('2d');
  if (!ctx) { cv.parentNode.removeChild(cv); return; }

  var w = 1, h = 1, dpr = 1, T = 0, raf = 0, visible = true;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = HERO.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setup();
  }

  /* ---- animação ---- */

  var cx = 0, cy = 0, R = 1, rings = 7;
  var GOLD = '199,154,75', DEEP = '165,113,58';

  function setup() {
    cx = w * (w > 900 ? .74 : .5);
    cy = h * (w > 900 ? .42 : .3);
    R = Math.max(w, h) * .78;
  }

  function frame() {
    var i, k, a;
    ctx.lineWidth = 1.2;
    for (i = 0; i < rings; i++) {
      var p = ((T * .09) + i / rings) % 1;
      var r = p * R;
      if (r < 6) continue;
      a = Math.sin(p * Math.PI) * .26;
      ctx.strokeStyle = 'rgba(' + GOLD + ',' + a.toFixed(3) + ')';
      ctx.beginPath();
      for (k = 0; k <= 72; k++) {
        var ang = k / 72 * 6.2831853;
        var wob = 1 + Math.sin(ang * 3 + T * .8 + i) * .022 + Math.sin(ang * 5 - T * .5) * .014;
        var x = cx + Math.cos(ang) * r * wob, y = cy + Math.sin(ang) * r * wob * .82;
        ctx[k ? 'lineTo' : 'moveTo'](x, y);
      }
      ctx.closePath(); ctx.stroke();
    }

    /* fibras radiais da íris */
    ctx.lineWidth = 1;
    var fib = 110;
    for (i = 0; i < fib; i++) {
      var ang2 = i / fib * 6.2831853 + T * .035;
      var r0 = R * .07, r1 = R * (.16 + .1 * (Math.sin(i * 12.9898) * .5 + .5));
      var al = .10 + .08 * (Math.sin(T * 1.1 + i * .7) * .5 + .5);
      ctx.strokeStyle = 'rgba(' + DEEP + ',' + al.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang2) * r0, cy + Math.sin(ang2) * r0 * .82);
      ctx.lineTo(cx + Math.cos(ang2) * r1, cy + Math.sin(ang2) * r1 * .82);
      ctx.stroke();
    }

    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .3);
    g.addColorStop(0, 'rgba(' + GOLD + ',.14)');
    g.addColorStop(1, 'rgba(' + GOLD + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R * .3, 0, 6.2832); ctx.fill();
  }

  /* ---- /animação ---- */

  var last = 0;
  function loop(ts) {
    /* se o React re-renderizou o hero e descartou este canvas, encerra o laço */
    if (!cv.isConnected) { stop(); return; }
    raf = requestAnimationFrame(loop);
    var dt = ts - last;
    if (!last || dt > 100) dt = 16;
    last = ts;
    T += dt / 1000;
    ctx.clearRect(0, 0, w, h);
    frame(dt / 1000);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  try { resize(); } catch (e) { cv.parentNode.removeChild(cv); return; }

  if (window.ResizeObserver) { new ResizeObserver(function () { resize(); }).observe(HERO); }
  else { window.addEventListener('resize', resize); }

  if (reduce) {
    ctx.clearRect(0, 0, w, h);
    try { frame(0); } catch (e) {}
    return;
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(HERO);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (visible) start();
  });
  start();
  }

  /* Remonta se o canvas for descartado por um re-render do React. */
  ready(function () {
    boot();
    var checks = 0;
    var iv = setInterval(function () {
      if (++checks > 30) { clearInterval(iv); return; }
      if (!document.querySelector('.hero canvas[data-hero-anim]')) boot();
    }, 500);
  });
})();

(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var KEY = 'ember-theme';

  /* ---------- 主题 ---------- */
  function apply(mode) {
    var real = mode === 'system'
      ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : mode;
    root.setAttribute('data-theme', real);
    root.setAttribute('data-mode', mode);
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', real === 'light' ? '#faf9f5' : '#1a1816');
  }
  $$('.theme-switch button').forEach(function (b) {
    b.addEventListener('click', function () {
      var mode = b.getAttribute('data-mode');
      try { localStorage.setItem(KEY, mode); } catch (e) {}
      apply(mode);
    });
  });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
    if (root.getAttribute('data-mode') === 'system') apply('system');
  });

  /* ---------- 移动端菜单 ---------- */
  var burger = $('#burger'), menu = $('#menu');
  if (burger) burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  /* ---------- Hero 节点网络 ---------- */
  var cv = $('#hero-net');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d');
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nodes = [], W = 0, H = 0, dpr = 1, running = false, visible = true, c1 = '#e08a62', c2 = '#f0c27b';
    var LINK = 150;
    function colors() {
      var cs = getComputedStyle(root);
      c1 = cs.getPropertyValue('--accent').trim() || c1;
      c2 = cs.getPropertyValue('--accent-2').trim() || c2;
    }
    function resize() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.max(18, Math.min(70, Math.round(W * H / 16000)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
          r: Math.random() * 1.6 + .8, hot: Math.random() < .22, ph: Math.random() * 6.28
        });
      }
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d, al;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!still) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
          if (a.y < -10) a.y = H + 10; else if (a.y > H + 10) a.y = -10;
        }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            al = (1 - Math.sqrt(d) / LINK) * .5;
            ctx.globalAlpha = al; ctx.strokeStyle = (a.hot || b.hot) ? c2 : c1; ctx.lineWidth = .8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        var pulse = still ? 1 : .75 + .25 * Math.sin(t / 900 + a.ph);
        ctx.globalAlpha = a.hot ? .95 : .6 * pulse;
        ctx.fillStyle = a.hot ? c2 : c1;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (a.hot ? 1.7 : 1) * pulse, 0, 6.2832); ctx.fill();
        if (a.hot) { // 光晕
          ctx.globalAlpha = .12 * pulse; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 5, 0, 6.2832); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) {
      if (!running) return;
      draw(t);
      requestAnimationFrame(loop);
    }
    function start() { if (still || running || !visible || document.hidden) return; running = true; requestAnimationFrame(loop); }
    function stop() { running = false; }
    colors(); resize(); draw(0);
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { resize(); draw(0); }, 150); });
    new MutationObserver(function () { colors(); if (still) draw(0); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
    }
    start();
  }

  /* ---------- 滚动入场 ---------- */
  var rv = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---------- 代码块：语言标签 + 复制 ---------- */
  $$('.prose figure.highlight').forEach(function (fig) {
    var lang = (fig.className.replace('highlight', '').trim().split(/\s+/)[0]) || 'text';
    var bar = document.createElement('div');
    bar.className = 'code-bar';
    bar.innerHTML = '<span></span><button type="button">复制</button>';
    bar.firstChild.textContent = lang;
    var btn = bar.lastChild;
    btn.addEventListener('click', function () {
      var code = fig.querySelector('pre');
      var text = code ? code.innerText : '';
      var done = function () { btn.textContent = '已复制'; setTimeout(function () { btn.textContent = '复制'; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done);
    });
    fig.insertBefore(bar, fig.firstChild);
  });

  /* ---------- 目录高亮 ---------- */
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[decodeURIComponent(a.getAttribute('href').slice(1))] = a; });
    var heads = $$('.prose h2, .prose h3, .prose h4').filter(function (h) { return map[h.id]; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('on'); });
          map[e.target.id].classList.add('on');
        }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    heads.forEach(function (h) { spy.observe(h); });
  }

  /* ---------- 搜索 ---------- */
  var box = $('#search'), input = $('#search-input'), list = $('#search-results');
  var data = null, sel = -1;
  function load() {
    if (data) return Promise.resolve(data);
    return fetch(window.__SEARCH_URL__).then(function (r) { return r.json(); })
      .then(function (d) { data = d; return d; }).catch(function () { data = []; return data; });
  }
  function open() {
    box.hidden = false; input.value = ''; render(''); input.focus(); load();
    document.body.style.overflow = 'hidden';
  }
  function close() { box.hidden = true; document.body.style.overflow = ''; }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render(q) {
    q = q.trim().toLowerCase();
    var src = data || [];
    var hits = !q ? src.slice(0, 6) : src.filter(function (p) {
      return (p.title + ' ' + p.tags.join(' ') + ' ' + p.text).toLowerCase().indexOf(q) > -1;
    }).slice(0, 12);
    sel = hits.length ? 0 : -1;
    list.innerHTML = hits.length ? hits.map(function (p, i) {
      return '<li><a href="' + esc(p.path) + '" class="' + (i === 0 ? 'sel' : '') + '"><b>' + esc(p.title) + '</b><small>' +
        esc(p.date) + (p.tags.length ? ' · ' + esc(p.tags.map(function (t) { return '#' + t; }).join(' ')) : '') + '</small></a></li>';
    }).join('') : '<li class="none">没有找到相关文章</li>';
  }
  function move(d) {
    var as = $$('#search-results a');
    if (!as.length) return;
    as[sel] && as[sel].classList.remove('sel');
    sel = (sel + d + as.length) % as.length;
    as[sel].classList.add('sel');
    as[sel].scrollIntoView({ block: 'nearest' });
  }
  if (box) {
    $('#search-open').addEventListener('click', open);
    box.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });
    input.addEventListener('input', function () { load().then(function () { render(input.value); }); });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.hidden ? open() : close(); return; }
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { var a = $$('#search-results a')[sel]; if (a) location.href = a.href; }
    });
  }
})();

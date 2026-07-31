/* 共用行為：深淺色、行動選單、捲動進場、影片燈箱、開場網絡 */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- 深淺色 ---- */
  var themeBtn = document.getElementById('theme');
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('shinzhu-theme');
    if (saved) root.setAttribute('data-theme', saved);
  } catch (e) {}
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var now = root.getAttribute('data-theme');
      if (!now) now = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
      var next = now === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('shinzhu-theme', next); } catch (e) {}
    });
  }

  /* ---- 行動選單 ---- */
  var burger = document.getElementById('burger');
  var links = document.getElementById('navlinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- 捲動進場 ---- */
  var rises = document.querySelectorAll('.rise');
  if (reduce || !('IntersectionObserver' in window)) {
    rises.forEach(function (e) { e.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
    rises.forEach(function (e) { io.observe(e); });
  }

  /* ---- 影片燈箱：點了才載入 iframe ---- */
  var lb = document.getElementById('lb');
  if (lb) {
    var box = lb.querySelector('.lb-box');
    var closeBtn = lb.querySelector('.lb-close');

    function open(id, title) {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = title || '影片';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      box.insertBefore(f, closeBtn);
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      var f = box.querySelector('iframe');
      if (f) f.remove();
      lb.classList.remove('on');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.vid-thumb').forEach(function (b) {
      b.addEventListener('click', function () {
        open(b.dataset.yt, b.dataset.title);
      });
    });
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('on')) close();
    });
  }

  /* ---- 開場的知識網絡 ---- */
  var c = document.getElementById('net');
  if (c && !reduce) {
    var x = c.getContext('2d'), W, H, pts = [], raf;
    function ink() {
      var d = root.getAttribute('data-theme');
      if (!d) d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
      return d === 'dark' ? '224,118,79' : '163,52,28';
    }
    function size() {
      var r = Math.min(devicePixelRatio || 1, 2);
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * r; c.height = H * r; x.setTransform(r, 0, 0, r, 0, 0);
      var n = Math.max(16, Math.min(40, Math.round(W * H / 22000)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16,
        r: Math.random() * 1.6 + .9
      });
    }
    function draw() {
      var cs = ink();
      x.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 148) {
            x.strokeStyle = 'rgba(' + cs + ',' + (.2 * (1 - d / 148)).toFixed(3) + ')';
            x.lineWidth = .7;
            x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke();
          }
        }
        x.fillStyle = 'rgba(' + cs + ',.34)';
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.284); x.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    size(); draw();
    addEventListener('resize', function () { cancelAnimationFrame(raf); size(); draw(); });
  }
})();

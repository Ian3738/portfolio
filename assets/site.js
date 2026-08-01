/* 共用行為：深淺色切換、行動選單、捲動進場、影片燈箱 */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var root = document.documentElement;

  /* ---- 深淺色 ---- */
  try {
    var saved = localStorage.getItem('site-theme');
    if (saved) root.setAttribute('data-theme', saved);
  } catch (e) {}
  var themeBtn = document.getElementById('theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var now = root.getAttribute('data-theme');
      if (!now) now = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
      var next = now === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('site-theme', next); } catch (e) {}
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
    }, { threshold: .06, rootMargin: '0px 0px -6% 0px' });
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
      b.addEventListener('click', function () { open(b.dataset.yt, b.dataset.title); });
    });
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('on')) close();
    });
  }
})();

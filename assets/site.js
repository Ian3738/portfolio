/* 共用行為：全幅選單、頁首狀態、捲動進場、影片燈箱 */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var body = document.body;

  /* ---- 全幅選單 ---- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    function setMenu(open) {
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target === menu) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* ---- 頁首：捲離開場後轉為實色 ---- */
  var head = document.getElementById('sitehead');
  if (head) {
    var hero = document.querySelector('.hero');
    function onScroll() {
      var limit = hero ? hero.offsetHeight - 80 : 40;
      var past = scrollY > limit;
      head.classList.toggle('solid', past);
      head.classList.toggle('over', !!hero && !past);   // 壓在開場圖上時轉白
    }
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
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
    }, { threshold: .05, rootMargin: '0px 0px -8% 0px' });
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
      body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      var f = box.querySelector('iframe');
      if (f) f.remove();
      lb.classList.remove('on');
      body.style.overflow = '';
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

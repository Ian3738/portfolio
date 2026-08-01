/* ============================================================
   手寫 SVG 圖表引擎。無外部相依。
   規格：長條 ≤24px、資料端 4px 圓角、相鄰間隔 2px 表面色、
        格線為實線髮絲、圖例僅在兩組以上時出現、標籤選擇性直標、
        文字一律用文字色階（不著色成資料色）、每張圖都有表格檢視。
   ============================================================ */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(v) {
    if (v === null || v === undefined) return '—';
    return (Math.round(v * 10) / 10).toLocaleString('en-US');
  }
  /* 圓角只在資料端：水平長條右端圓、左端方 */
  function barRightPath(x, y, w, h, r) {
    r = Math.min(r, w, h / 2);
    if (w <= 0.5) return 'M' + x + ',' + y + 'h0.5v' + h + 'h-0.5z';
    return 'M' + x + ',' + y +
      'h' + (w - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
      'v' + (h - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r +
      'h' + (-(w - r)) + 'z';
  }
  function barTopPath(x, y, w, h, r) {
    r = Math.min(r, h, w / 2);
    if (h <= 0.5) return 'M' + x + ',' + (y + h) + 'h' + w + 'v-0.5h' + (-w) + 'z';
    return 'M' + x + ',' + (y + h) +
      'v' + (-(h - r)) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + (-r) +
      'h' + (w - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
      'v' + (h - r) + 'z';
  }
  /* 落在色塊裡的字：依填色相對亮度挑白或墨，確保永遠過對比 */
  function onFill(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return '#fff';
    var n = parseInt(m[1], 16);
    var c = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(function (v) {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    /* 與白字、與近黑字的對比取大者 */
    return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.10) ? '#fff' : '#0b0d11';
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    var e = Math.pow(10, Math.floor(Math.log10(v))), n = v / e;
    var s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return s * e;
  }

  /* ---------- tooltip ---------- */
  function attachTip(host) {
    var tip = document.createElement('div');
    tip.className = 'tip';
    tip.hidden = true;
    host.appendChild(tip);
    return {
      show: function (html, x, y) {
        tip.innerHTML = html;
        tip.hidden = false;
        var hb = host.getBoundingClientRect(), tb = tip.getBoundingClientRect();
        var left = Math.max(4, Math.min(x - tb.width / 2, hb.width - tb.width - 4));
        tip.style.left = left + 'px';
        tip.style.top = Math.max(2, y - tb.height - 12) + 'px';
      },
      hide: function () { tip.hidden = true; }
    };
  }

  /* ---------- 表格檢視 ---------- */
  function tableView(host, cols, rows, caption) {
    var d = document.createElement('details');
    d.className = 'tbl';
    var s = document.createElement('summary');
    s.textContent = '表格檢視';
    d.appendChild(s);
    var wrapEl = document.createElement('div');
    wrapEl.className = 'tbl-scroll';
    var t = document.createElement('table');
    if (caption) { var cp = document.createElement('caption'); cp.textContent = caption; t.appendChild(cp); }
    var th = document.createElement('thead'), tr = document.createElement('tr');
    cols.forEach(function (c) { var e = document.createElement('th'); e.textContent = c; tr.appendChild(e); });
    th.appendChild(tr); t.appendChild(th);
    var tb = document.createElement('tbody');
    rows.forEach(function (r) {
      var x = document.createElement('tr');
      r.forEach(function (v, i) {
        var e = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) e.setAttribute('scope', 'row');
        e.textContent = v;
        x.appendChild(e);
      });
      tb.appendChild(x);
    });
    t.appendChild(tb);
    wrapEl.appendChild(t);
    d.appendChild(wrapEl);
    host.appendChild(d);
  }

  /* ---------- 自動重繪 ---------- */
  function responsive(host, draw) {
    var plot = host.querySelector('.plot');
    var t;
    function run() {
      var w = plot.clientWidth;
      if (w < 40) return;
      plot.innerHTML = '';
      draw(plot, w);
    }
    run();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { clearTimeout(t); t = setTimeout(run, 120); }).observe(plot);
    } else {
      addEventListener('resize', function () { clearTimeout(t); t = setTimeout(run, 160); });
    }
    var mo = new MutationObserver(run);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    matchMedia('(prefers-color-scheme:dark)').addEventListener('change', run);
  }

  /* ============================================================
     水平長條：單一資料組
     opts: {rows:[{name,value,note}], unit, suffix, max, highlight:idx, labelCol}
     ============================================================ */
  function barH(host, opts) {
    var rows = opts.rows, tip = attachTip(host);
    responsive(host, function (plot, W) {
      var s1 = css('--series-1'), hl = css('--series-2');
      var grid = css('--grid'), axis = css('--axis'), muted = css('--ink-muted'),
          ink = css('--ink-1'), surf = css('--surface');
      var labelW = Math.min(opts.labelCol || 172, Math.max(96, W * 0.38));
      var valW = 54, padT = 18, padB = 26, rowH = 30, bar = Math.min(18, rowH - 12);
      var H = padT + rows.length * rowH + padB;
      var x0 = labelW, x1 = W - valW, pw = Math.max(20, x1 - x0);
      var max = opts.max || niceMax(Math.max.apply(null, rows.map(function (r) { return r.value; })));

      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, plot);

      /* 格線（實線髮絲，退到背後） */
      var ticks = [0, max / 2, max];
      ticks.forEach(function (tv) {
        var x = x0 + pw * (tv / max);
        el('line', { x1: x, y1: padT - 6, x2: x, y2: padT + rows.length * rowH, stroke: grid, 'stroke-width': 1 }, svg);
        var tx = el('text', { x: x, y: H - 9, 'text-anchor': 'middle', class: 'ax' }, svg);
        tx.setAttribute('fill', muted);
        tx.textContent = fmt(tv) + (opts.suffix || '');
      });
      el('line', { x1: x0, y1: padT - 6, x2: x0, y2: padT + rows.length * rowH, stroke: axis, 'stroke-width': 1 }, svg);

      rows.forEach(function (r, i) {
        var y = padT + i * rowH + (rowH - bar) / 2;
        var w = pw * (r.value / max);
        var color = (opts.highlight === i) ? hl : s1;

        var lb = el('text', { x: x0 - 10, y: y + bar / 2 + 4, 'text-anchor': 'end', class: 'lbl' }, svg);
        lb.setAttribute('fill', ink);
        lb.textContent = r.name;

        if (r.value > 0) {
          el('path', { d: barRightPath(x0, y, w, bar, 4), fill: color }, svg);
        } else {
          el('line', { x1: x0, y1: y, x2: x0, y2: y + bar, stroke: axis, 'stroke-width': 2 }, svg);
        }

        var vt = el('text', { x: x1 + 8, y: y + bar / 2 + 4, class: 'val' }, svg);
        vt.setAttribute('fill', r.value === 0 ? muted : ink);
        vt.textContent = (opts.pct ? r.value + '%' : fmt(r.value)) + (opts.unit || '');

        /* 命中區至少 24px 高 */
        var hit = el('rect', {
          x: 0, y: padT + i * rowH - 2, width: W, height: Math.max(24, rowH),
          fill: 'transparent', style: 'cursor:crosshair'
        }, svg);
        hit.addEventListener('pointerenter', function (e) {
          var b = plot.getBoundingClientRect();
          tip.show('<b>' + r.name + '</b>' + (r.note ? '<i>' + r.note + '</i>' : '') +
            '<u>' + (opts.pct ? r.value + '%' : fmt(r.value) + (opts.unit || '')) + '</u>',
            e.clientX - b.left, padT + i * rowH + rowH / 2);
        });
        hit.addEventListener('pointerleave', tip.hide);
      });
      void surf;
    });
    tableView(host, [opts.cat || '項目', opts.valHead || '數值'],
      rows.map(function (r) { return [r.name, (opts.pct ? r.value + '%' : fmt(r.value) + (opts.unit || '')) + (r.note ? '（' + r.note + '）' : '')]; }),
      opts.caption);
  }

  /* ============================================================
     直條對比（強調其一）
     ============================================================ */
  function columns(host, opts) {
    var rows = opts.rows, tip = attachTip(host);
    responsive(host, function (plot, W) {
      var s1 = css('--series-1'), dim = css('--axis'), grid = css('--grid'),
          muted = css('--ink-muted'), ink = css('--ink-1');
      var padT = 34, padB = 46, H = 250, base = H - padB;
      var max = niceMax(Math.max.apply(null, rows.map(function (r) { return r.count; })));
      var band = W / rows.length, bw = Math.min(52, band * 0.42);
      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, plot);

      [0, max / 2, max].forEach(function (tv) {
        var y = base - (base - padT) * (tv / max);
        el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: grid, 'stroke-width': 1 }, svg);
        var t = el('text', { x: 0, y: y - 5, class: 'ax' }, svg);
        t.setAttribute('fill', muted); t.textContent = fmt(tv);
      });
      el('line', { x1: 0, y1: base, x2: W, y2: base, stroke: dim, 'stroke-width': 1 }, svg);

      rows.forEach(function (r, i) {
        var cx = band * i + band / 2, h = (base - padT) * (r.count / max);
        var color = (opts.highlight === i) ? s1 : css('--ink-muted');
        el('path', { d: barTopPath(cx - bw / 2, base - h, bw, h, 4), fill: color, opacity: opts.highlight === i ? 1 : .5 }, svg);
        var v = el('text', { x: cx, y: base - h - 10, 'text-anchor': 'middle', class: 'big' }, svg);
        v.setAttribute('fill', ink); v.textContent = r.count;
        r.name.split('　').forEach(function (part, k) {
          var t = el('text', { x: cx, y: base + 18 + k * 15, 'text-anchor': 'middle', class: 'lbl' }, svg);
          t.setAttribute('fill', muted); t.textContent = part;
        });
        var hit = el('rect', { x: band * i, y: padT, width: band, height: base - padT, fill: 'transparent', style: 'cursor:crosshair' }, svg);
        hit.addEventListener('pointerenter', function () {
          tip.show('<b>' + r.name.replace('　', ' ') + '</b><u>' + r.count + ' ' + (opts.unit || '') + '</u>', cx, base - h);
        });
        hit.addEventListener('pointerleave', tip.hide);
      });
    });
    tableView(host, [opts.cat || '項目', opts.valHead || '數值'],
      rows.map(function (r) { return [r.name.replace('　', ' '), r.count + ' ' + (opts.unit || '')]; }), opts.caption);
  }

  /* ============================================================
     堆疊橫條（流程 / 部分對整體），含圖例
     ============================================================ */
  function stack(host, opts) {
    var rows = opts.rows, tip = attachTip(host);
    var total = rows.reduce(function (a, r) { return a + r.count; }, 0);

    var lg = document.createElement('div');
    lg.className = 'legend';
    rows.forEach(function (r, i) {
      var s = document.createElement('span');
      s.innerHTML = '<i data-s="' + (i + 1) + '"></i>' + r.name + ' <b>' + r.count + '</b>';
      lg.appendChild(s);
    });
    host.querySelector('.plot').insertAdjacentElement('beforebegin', lg);

    responsive(host, function (plot, W) {
      var surf = css('--surface'), ink = css('--ink-1');
      var H = 66, y = 10, bh = 30, GAP = 2;
      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, plot);
      var x = 0;
      rows.forEach(function (r, i) {
        var w = (W - GAP * (rows.length - 1)) * (r.count / total);
        var first = i === 0, last = i === rows.length - 1;
        var d = last ? barRightPath(x, y, w, bh, 4)
          : first ? 'M' + x + ',' + y + 'h' + w + 'v' + bh + 'h' + (-w) + 'z'
            : 'M' + x + ',' + y + 'h' + w + 'v' + bh + 'h' + (-w) + 'z';
        el('path', { d: d, fill: css('--series-' + (i + 1)) }, svg);

        /* 只在寬度容得下時才把標籤放進去，字色依填色亮度挑白或墨 */
        if (w > 46) {
          var t = el('text', { x: x + w / 2, y: y + bh / 2 + 4, 'text-anchor': 'middle', class: 'val' }, svg);
          t.setAttribute('fill', onFill(css('--series-' + (i + 1))));
          t.textContent = r.count;
        }
        var hit = el('rect', { x: x, y: 0, width: w, height: H, fill: 'transparent', style: 'cursor:crosshair' }, svg);
        (function (rr, xx, ww) {
          hit.addEventListener('pointerenter', function () {
            tip.show('<b>' + rr.name + '</b><u>' + rr.count + ' 篇　' + Math.round(rr.count / total * 100) + '%</u>', xx + ww / 2, y);
          });
          hit.addEventListener('pointerleave', tip.hide);
        })(r, x, w);
        x += w + GAP;
      });
      var tot = el('text', { x: 0, y: H - 6, class: 'ax' }, svg);
      tot.setAttribute('fill', css('--ink-muted'));
      tot.textContent = '合計 ' + total + ' 篇';
      void surf; void ink;
    });
    tableView(host, ['狀態', '篇數', '占比'],
      rows.map(function (r) { return [r.name, r.count + ' 篇', Math.round(r.count / total * 100) + '%']; }), opts.caption);
  }

  /* ============================================================
     散布圖：社群成員的發文量 × 閱讀量（單一資料組）
     ============================================================ */
  function scatter(host, opts) {
    var pts = opts.points, tip = attachTip(host);
    responsive(host, function (plot, W) {
      var s1 = css('--series-1'), grid = css('--grid'), axis = css('--axis'),
          muted = css('--ink-muted'), surf = css('--surface'), ink = css('--ink-1');
      var padL = 46, padR = 16, padT = 20, padB = 46, H = 300;
      var pw = W - padL - padR, ph = H - padT - padB;
      var xm = niceMax(Math.max.apply(null, pts.map(function (p) { return p.notes; })));
      var ym = niceMax(Math.max.apply(null, pts.map(function (p) { return p.reads; })));
      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, plot);

      [0, .25, .5, .75, 1].forEach(function (f) {
        var y = padT + ph * (1 - f);
        el('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: grid, 'stroke-width': 1 }, svg);
        var t = el('text', { x: padL - 8, y: y + 4, 'text-anchor': 'end', class: 'ax' }, svg);
        t.setAttribute('fill', muted); t.textContent = fmt(ym * f);
      });
      [0, .5, 1].forEach(function (f) {
        var x = padL + pw * f;
        var t = el('text', { x: x, y: H - 24, 'text-anchor': 'middle', class: 'ax' }, svg);
        t.setAttribute('fill', muted); t.textContent = fmt(xm * f);
      });
      el('line', { x1: padL, y1: padT, x2: padL, y2: padT + ph, stroke: axis, 'stroke-width': 1 }, svg);
      el('line', { x1: padL, y1: padT + ph, x2: W - padR, y2: padT + ph, stroke: axis, 'stroke-width': 1 }, svg);

      var ax = el('text', { x: padL + pw / 2, y: H - 6, 'text-anchor': 'middle', class: 'ax' }, svg);
      ax.setAttribute('fill', muted); ax.textContent = '發文數 →';
      var ay = el('text', { x: 12, y: padT + ph / 2, class: 'ax', transform: 'rotate(-90 12 ' + (padT + ph / 2) + ')', 'text-anchor': 'middle' }, svg);
      ay.setAttribute('fill', muted); ay.textContent = '閱讀數 →';

      pts.forEach(function (p) {
        var cx = padL + pw * (p.notes / xm), cy = padT + ph * (1 - p.reads / ym);
        /* 2px 表面色環，讓重疊的點分得開 */
        el('circle', { cx: cx, cy: cy, r: 6, fill: s1, stroke: surf, 'stroke-width': 2 }, svg);
        var hit = el('circle', { cx: cx, cy: cy, r: 14, fill: 'transparent', style: 'cursor:crosshair' }, svg);
        hit.addEventListener('pointerenter', function () {
          tip.show('<b>成員 ' + p.id + '</b><i>發文 ' + p.notes + '　回應 ' + p.given + '</i><u>閱讀 ' + p.reads + ' 次</u>', cx, cy);
        });
        hit.addEventListener('pointerleave', tip.hide);
      });
      void ink;
    });
    tableView(host, ['成員', '發文', '給出回應', '被回應', '閱讀', '被閱讀'],
      pts.map(function (p) { return [p.id, p.notes, p.given, p.recv, p.reads, p.readBy]; }), opts.caption);
  }

  /* ============================================================
     Build-on 網絡圖：真實的社群回應關係
     ============================================================ */
  function network(host, opts) {
    var nodes = opts.nodes, edges = opts.edges, tip = attachTip(host);
    responsive(host, function (plot, W) {
      var s1 = css('--series-1'), axis = css('--axis'), surf = css('--surface'),
          muted = css('--ink-muted');
      var H = Math.max(300, Math.min(420, W * 0.62));
      var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, plot);

      var idx = {}, N = nodes.map(function (n, i) {
        idx[n.id] = i;
        var a = (i / nodes.length) * Math.PI * 2;
        return { id: n.id, deg: 0, w: n.notes,
                 x: W / 2 + Math.cos(a) * W * 0.26, y: H / 2 + Math.sin(a) * H * 0.32, vx: 0, vy: 0 };
      });
      var E = edges.filter(function (e) { return idx[e[0]] !== undefined && idx[e[1]] !== undefined; })
        .map(function (e) {
          var a = idx[e[0]], b = idx[e[1]];
          N[a].deg++; N[b].deg++;
          return { a: a, b: b, w: e[2] };
        });

      /* 力導向：斥力 + 彈簧 + 向心，跑固定迭代後定格 */
      for (var it = 0; it < 320; it++) {
        var k = 1 - it / 320;
        for (var i = 0; i < N.length; i++) for (var j = i + 1; j < N.length; j++) {
          var dx = N[i].x - N[j].x, dy = N[i].y - N[j].y, d2 = dx * dx + dy * dy || 1;
          var f = 2600 / d2;
          var d = Math.sqrt(d2);
          N[i].vx += dx / d * f; N[i].vy += dy / d * f;
          N[j].vx -= dx / d * f; N[j].vy -= dy / d * f;
        }
        E.forEach(function (e) {
          var A = N[e.a], B = N[e.b];
          var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
          var f = (d - 76) * 0.012 * Math.min(3, e.w);
          A.vx += dx / d * f; A.vy += dy / d * f;
          B.vx -= dx / d * f; B.vy -= dy / d * f;
        });
        N.forEach(function (n) {
          n.vx += (W / 2 - n.x) * 0.012; n.vy += (H / 2 - n.y) * 0.012;
          n.x += n.vx * k * 0.5; n.y += n.vy * k * 0.5;
          n.vx *= 0.82; n.vy *= 0.82;
          n.x = Math.max(20, Math.min(W - 20, n.x));
          n.y = Math.max(20, Math.min(H - 20, n.y));
        });
      }

      var gE = el('g', {}, svg), gN = el('g', {}, svg);
      var lines = E.map(function (e) {
        return el('line', {
          x1: N[e.a].x, y1: N[e.a].y, x2: N[e.b].x, y2: N[e.b].y,
          stroke: axis, 'stroke-width': Math.min(2.4, 0.7 + e.w * 0.45), 'stroke-linecap': 'round', opacity: .75
        }, gE);
      });
      var maxDeg = Math.max.apply(null, N.map(function (n) { return n.deg; })) || 1;
      N.forEach(function (n, i) {
        var r = 4 + 7 * Math.sqrt(n.deg / maxDeg);
        var c = el('circle', { cx: n.x, cy: n.y, r: r, fill: s1, stroke: surf, 'stroke-width': 2, opacity: n.deg ? 1 : .4 }, gN);
        var hit = el('circle', { cx: n.x, cy: n.y, r: Math.max(14, r + 8), fill: 'transparent', style: 'cursor:crosshair' }, gN);
        hit.addEventListener('pointerenter', function () {
          lines.forEach(function (L, k) {
            var on = E[k].a === i || E[k].b === i;
            L.setAttribute('opacity', on ? 1 : .12);
            L.setAttribute('stroke', on ? s1 : axis);
          });
          c.setAttribute('r', r + 2);
          tip.show('<b>成員 ' + n.id + '</b><i>發文 ' + n.w + ' 則</i><u>連結 ' + n.deg + ' 條</u>', n.x, n.y);
        });
        hit.addEventListener('pointerleave', function () {
          lines.forEach(function (L) { L.setAttribute('opacity', .75); L.setAttribute('stroke', axis); });
          c.setAttribute('r', r);
          tip.hide();
        });
      });
      var cap = el('text', { x: 0, y: H - 4, class: 'ax' }, svg);
      cap.setAttribute('fill', muted);
      cap.textContent = nodes.length + ' 位成員　' + E.length + ' 條回應連結　點大小 = 連結數';
    });
    tableView(host, ['成員', '發文', '給出回應', '被回應'],
      nodes.map(function (n) { return [n.id, n.notes, n.given, n.recv]; }), opts.caption);
  }

  /* ---------- 對外 ---------- */
  window.Charts = { barH: barH, columns: columns, stack: stack, scatter: scatter, network: network };

  document.addEventListener('DOMContentLoaded', function () {
    var D = window.DATA;
    if (!D) return;
    function host(id) { return document.getElementById(id); }
    var h;

    if ((h = host('c-kb-pct'))) {
      var pct = D.kb.filter(function (k) { return k.type === 'pct'; })
        .map(function (k) { return { name: '原則 ' + k.no + '　' + k.metric, value: k.value, note: k.name }; });
      barH(h, { rows: pct, pct: true, max: 100, suffix: '%', cat: '指標', valHead: '比例',
                caption: '築師 2.0 社群・知識翻新原則的比例型指標' });
    }
    if ((h = host('c-scaffold'))) {
      barH(h, { rows: D.scaffolds.map(function (s) { return { name: s.name, value: s.count }; }),
                unit: ' 次', cat: '鷹架', valHead: '使用次數',
                caption: '築師 2.0 社群・十二種知識翻新鷹架的使用次數' });
    }
    if ((h = host('c-network'))) {
      network(h, { nodes: D.members, edges: D.edges, caption: '築師 2.0 社群・build-on 回應網絡（成員已匿名）' });
    }
    if ((h = host('c-scatter'))) {
      scatter(h, { points: D.members.filter(function (m) { return m.notes || m.reads; }),
                   caption: '築師 2.0 社群・成員發文量與閱讀量（成員已匿名）' });
    }
    if ((h = host('c-reflect'))) {
      columns(h, { rows: D.reflect, highlight: 1, unit: '篇', cat: '時機', valHead: '反思篇數',
                   caption: '同一群學生、同一個平台，差別只在有沒有給出獨立的反思時間' });
    }
    if ((h = host('c-pubs'))) {
      stack(h, { rows: D.pubs, caption: '期刊論文的審查進度' });
    }
    if ((h = host('c-works'))) {
      barH(h, { rows: D.works.map(function (w) { return { name: w.name, value: w.count }; }),
                unit: ' 件', cat: '類別', valHead: '件數',
                caption: '教材與作品的類別分布' });
    }
  });
})();

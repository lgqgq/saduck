/* SaDuck 考公知识库 前端交互 */
(function () {
  'use strict';

  /* ---------- 主题切换 ---------- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('saduck-theme'); } catch (e) {}

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var btn = document.getElementById('themeBtn');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? '切换到浅色' : '切换到深色');
  }

  var initial = stored ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(initial);

  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('saduck-theme', next); } catch (e) {}
    });
  }

  /* ---------- 侧边栏折叠 ---------- */
  document.querySelectorAll('.nav-group-title').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.closest('.nav-group');
      var wasOpen = group.classList.contains('open');
      group.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(!wasOpen));
    });
  });

  /* ---------- 移动端菜单 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var sidebar = document.getElementById('sidebar');
  var mask = document.getElementById('mask');

  function closeMenu() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); }
    if (mask) mask.classList.remove('show');
  }

  if (menuBtn && sidebar && mask) {
    menuBtn.addEventListener('click', function () {
      var opening = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', opening);
      menuBtn.setAttribute('aria-expanded', String(opening));
      mask.classList.toggle('show', opening);
    });
    mask.addEventListener('click', closeMenu);
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }

  /* ---------- 站内搜索 ---------- */
  var data = window.SEARCH_DATA || [];
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  if (!input || !results) return;

  function norm(s) {
    return (s || '').toLowerCase();
  }

  function search(q) {
    q = norm(q.trim());
    if (!q) return [];
    var hits = [];
    for (var i = 0; i < data.length; i++) {
      var it = data[i];
      var title = norm(it.title);
      var kw = norm(it.keywords);
      var excerpt = norm(it.excerpt);
      var score = 0;
      if (title.indexOf(q) !== -1) score += 100;
      if (title === q) score += 200;
      if (kw.indexOf(q) !== -1) score += 60;
      if (excerpt.indexOf(q) !== -1) score += 20;
      if (score > 0) hits.push({ it: it, score: score });
    }
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, 10);
  }

  function show(q) {
    var hits = search(q);
    var base = window.BASE || './';
    if (!hits.length) {
      results.innerHTML = '<div class="sr-none">未找到相关知识点，试试「申论」「行测」「时间」等关键词</div>';
      results.hidden = false;
      return;
    }
    var html = '';
    hits.forEach(function (h, idx) {
      var it = h.it;
      html += '<a href="' + base + it.path + '" data-idx="' + idx + '">' +
        '<div class="sr-title">' + it.title + '</div>' +
        '<div class="sr-meta">' + it.section + '</div>' +
        (it.excerpt ? '<div class="sr-excerpt">' + it.excerpt + '</div>' : '') +
        '</a>';
    });
    results.innerHTML = html;
    results.hidden = false;
  }

  var lastQ = '';
  input.addEventListener('input', function () {
    lastQ = input.value;
    show(input.value);
  });

  input.addEventListener('keydown', function (e) {
    var links = results.querySelectorAll('a');
    var active = results.querySelector('a.active');
    var idx = -1;
    if (active) idx = Array.prototype.indexOf.call(links, active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, links.length - 1);
      activate(links, idx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      activate(links, idx);
    } else if (e.key === 'Enter' && active) {
      e.preventDefault();
      window.location.href = active.getAttribute('href');
    } else if (e.key === 'Escape') {
      results.hidden = true;
      input.blur();
    }
  });

  function activate(links, idx) {
    links.forEach(function (l, i) { l.classList.toggle('active', i === idx); });
    if (links[idx]) links[idx].scrollIntoView({ block: 'nearest' });
  }

  document.addEventListener('click', function (e) {
    if (!results.contains(e.target) && e.target !== input) results.hidden = true;
  });

  /* 快捷搜索：键盘 / */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });
})();

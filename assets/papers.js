(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  // Builds an element. Text always goes through textContent, so nothing here can inject HTML.
  function el(tag, props, children) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (k === 'class') n.className = props[k];
      else n.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  /* ---------------- Theme (same choice as the home page) ---------------- */
  var THEME_COLOR = { light: '#f8f7f3', dark: '#0b1213' };
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', THEME_COLOR[t]);
  }
  var savedTheme = store('theme');
  var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : (systemDark ? 'dark' : 'light'));
  $('#theme').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store('theme', next);
  });

  /* ---------------- Mobile menu ---------------- */
  var nav = $('#nav'), menuBtn = $('#menu');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------------- "Back to top" keeps "#top" out of the address bar ---------------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href="#top"]') : null;
    if (!a) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ================================================================
     CONTENT. The papers themselves are in assets/papers-data.js.
     Each theme uses one of the page's palette colours (k).
     ================================================================ */
  var THEMES = {
    phys: { name: 'Physics-based modelling', k: 2 },
    reason: { name: 'Step-wise reasoning', k: 1 },
    agents: { name: 'Agents & planning', k: 3 },
    emotion: { name: 'Multimodal emotion recognition', k: 4 }
  };
  var THEME_KEYS = ['phys', 'reason', 'agents', 'emotion'];

  var list = $('#paper-list');
  var filterBox = $('#paper-filters');
  var searchBox = $('#paper-search');
  var sortBtn = $('#paper-sort');
  var statusEl = $('#paper-status');
  var emptyEl = $('#paper-empty');
  var PAPERS = (window.PAPERS || []).map(function (p, i) {
    return { n: i + 1, y: p.y, t: p.t, a: p.a, v: p.v, u: p.u, th: p.th };
  });

  if (!PAPERS.length) {
    statusEl.textContent = 'The list of papers could not be loaded.';
    return;
  }

  // A short label for where the link goes (DOI, arXiv or the conference proceedings).
  function sourceOf(u) {
    var host = '';
    try { host = new URL(u).hostname; } catch (e) { return 'Link'; }
    if (host === 'doi.org') return 'DOI';
    if (host === 'arxiv.org') return 'arXiv';
    if (/(^|\.)(neurips|nips)\.cc$/.test(host)) return 'NeurIPS';
    return host;
  }

  var state = { theme: 'all', query: '', newestFirst: false };

  /* ---------------- Numbers that cannot drift from the data ---------------- */
  var counts = { all: PAPERS.length };
  THEME_KEYS.forEach(function (k) { counts[k] = PAPERS.filter(function (p) { return p.th === k; }).length; });
  var years = PAPERS.map(function (p) { return p.y; });
  var firstYear = Math.min.apply(null, years), lastYear = Math.max.apply(null, years);
  $$('[data-papers-total]').forEach(function (n) { n.textContent = String(PAPERS.length); });
  $$('[data-papers-first]').forEach(function (n) { n.textContent = String(firstYear); });
  $$('[data-papers-last]').forEach(function (n) { n.textContent = String(lastYear); });

  /* ---------------- Theme filter tiles (they double as the summary numbers) ---------------- */
  var tiles = [];
  function addTile(key, label) {
    var b = el('button', { class: 'paper-filter', type: 'button', 'aria-pressed': key === 'all' ? 'true' : 'false', 'data-filter': key }, [
      el('b', { text: String(counts[key]) }),
      el('span', { text: label })
    ]);
    if (key !== 'all') b.setAttribute('data-k', String(THEMES[key].k));
    b.addEventListener('click', function () {
      state.theme = key;
      tiles.forEach(function (t) { t.setAttribute('aria-pressed', String(t === b)); });
      render();
    });
    tiles.push(b);
    filterBox.appendChild(b);
  }
  addTile('all', 'All papers');
  THEME_KEYS.forEach(function (k) { addTile(k, THEMES[k].name); });

  /* ---------------- List ---------------- */
  function matches(p) {
    if (state.theme !== 'all' && p.th !== state.theme) return false;
    if (!state.query) return true;
    var hay = (p.t + ' ' + p.a + ' ' + p.v + ' ' + p.y + ' ' + THEMES[p.th].name).toLowerCase();
    return state.query.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function item(p) {
    var th = THEMES[p.th];
    var title = el('h3', { class: 'paper-title' }, [
      el('a', { href: p.u, target: '_blank', rel: 'noopener noreferrer' }, [
        document.createTextNode(p.t),
        el('span', { class: 'visually-hidden', text: ' (opens in a new tab)' })
      ])
    ]);
    var meta = el('div', { class: 'paper-meta' }, [
      el('span', { class: 'pill', text: th.name }),
      el('span', { class: 'paper-year', text: String(p.y) }),
      el('span', { class: 'paper-src', text: sourceOf(p.u) + ' ↗', 'aria-hidden': 'true' })
    ]);
    var li = el('li', { class: 'paper', 'data-k': String(th.k) }, [
      el('span', { class: 'paper-no', text: String(p.n), 'aria-label': 'Paper ' + p.n }),
      el('div', { class: 'paper-body' }, [
        title,
        el('p', { class: 'paper-authors', text: p.a }),
        el('p', { class: 'paper-venue', text: p.v }),
        meta
      ])
    ]);
    return li;
  }

  function render() {
    var shown = PAPERS.filter(matches);
    shown.sort(function (a, b) { return state.newestFirst ? b.n - a.n : a.n - b.n; });
    list.textContent = '';
    shown.forEach(function (p) { list.appendChild(item(p)); });
    emptyEl.hidden = shown.length !== 0;
    statusEl.textContent = 'Showing ' + shown.length + ' of ' + PAPERS.length + ' papers' + (state.theme === 'all' ? '' : ' · ' + THEMES[state.theme].name) + (state.query ? ' · matching "' + state.query + '"' : '') + '.';
  }

  searchBox.addEventListener('input', function () {
    state.query = searchBox.value.trim().toLowerCase();
    render();
  });
  searchBox.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && searchBox.value) { searchBox.value = ''; state.query = ''; render(); }
  });
  sortBtn.addEventListener('click', function () {
    state.newestFirst = !state.newestFirst;
    sortBtn.textContent = state.newestFirst ? 'Newest first' : 'Oldest first';
    sortBtn.setAttribute('aria-label', 'Sort order: ' + (state.newestFirst ? 'newest first' : 'oldest first') + '. Press to reverse.');
    render();
  });

  render();
})();

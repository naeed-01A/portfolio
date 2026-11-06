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

  // Fixed icon markup (constants written here, never built from data).
  var SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICONS = {
    math: SVG + '<path d="M18 6H6l6 6-6 6h12"/></svg>',
    phys: SVG + '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
    cs: SVG + '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>'
  };

  /* ---------------- Theme ---------------- */
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

  /* ---------------- Clean address bar: the logo and "Back to top" never leave "#top" in the URL ---------------- */
  function cleanUrl() {
    if (location.hash === '#top' && window.history && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href="#top"]') : null;
    if (!a) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    cleanUrl();
  });
  cleanUrl();

  /* ---------------- Mobile menu ---------------- */
  var nav = $('#nav'), menuBtn = $('#menu');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------------- Live India time (IST is one zone for the whole country) ---------------- */
  var clock = $('#clock');
  function tickClock() {
    try {
      var f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
      clock.textContent = f.format(new Date()) + ' · India Standard Time (IST, UTC+5:30)';
    } catch (e) { /* keep the static text */ }
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ================================================================
     CONTENT (edit here). The timeline, the CGPA chart, the skill tabs,
     the topic counts and the numbers in the hero card are all drawn
     from these lists, so one change updates every place.
     ================================================================ */

  // Colour key k: 1, 2, 3 are the same three colours used for these subjects across the whole page.
  var FIELDS = {
    math: { name: "Mathematics", k: 1,
      ai: "I can follow a multi-step solution line by line, find the first wrong step, and judge whether a numerical answer is accurate and stable." },
    phys: { name: "Physics", k: 2,
      ai: "I can tell whether a robot's action is physically possible and whether a chain of cause and effect obeys mechanics, energy and electromagnetism." },
    cs: { name: "Computer Science", k: 3,
      ai: "I can trace code, algorithms and plans step by step, and I know how search, planning and intelligent agents work." }
  };
  var FIELD_KEYS = ["math", "phys", "cs"];

  // Newest first. `main` is the one subject a stage specialises in (null when several are studied together).
  // A stage is graded either with `cgpa` (out of 10) or with `percent` and `division`; with neither it is still running.
  // `topics[subject]` is a list of topic areas: [area name, subtopic, subtopic, ...].
  // `basis` says where the topic list comes from. Topic lists follow the published syllabus of each programme.
  var EDU = [
    {
      when: "2023 – 2025", level: "Master's degree", short: "Master's", chartName: "Master's · Physics",
      what: "Master's in Physics",
      org: "Jamia Millia Islamia, New Delhi", orgShort: "Jamia Millia Islamia",
      url: "https://www.jmi.ac.in/", site: "jmi.ac.in",
      fields: ["phys"], main: "phys", cgpa: 9.7,
      body: "Master's degree in Physics at Jamia Millia Islamia, New Delhi.",
      basis: "Core courses of the M.Sc. Physics programme (CBCS), Department of Physics, Jamia Millia Islamia.",
      topics: {
        phys: [
          ["Quantum mechanics", "Dirac notation and operators", "angular momentum", "identical particles and second quantisation", "approximation methods", "scattering theory", "relativistic quantum mechanics and the Dirac equation"],
          ["Classical mechanics", "Lagrangian and Hamiltonian formalism", "canonical transformations and Poisson brackets", "Hamilton-Jacobi equation", "rigid body dynamics", "small oscillations", "chaos and nonlinear dynamics"],
          ["Mathematical physics", "complex analysis", "partial differential equations", "Green's functions", "integral equations", "tensor analysis"],
          ["Electrodynamics", "potential formulation", "retarded solutions of the wave equation", "radiation by moving charges", "relativistic electrodynamics"],
          ["Statistical mechanics", "statistical basis of thermodynamics", "canonical and grand-canonical ensembles", "quantum statistical mechanics", "phase transitions"],
          ["Condensed matter physics", "bonding in crystals", "phonons", "free electron theory", "electronic band structure", "transport", "magnetism", "superconductivity"],
          ["Atomic, molecular, nuclear and particle physics", "atomic and molecular spectra", "nuclear forces", "particle detection and accelerators", "elementary particles"],
          ["Numerical analysis and programming", "roots of equations", "interpolation", "numerical differentiation and integration", "ordinary and partial differential equations"]
        ]
      }
    },
    {
      when: "2020 – 2022", level: "Master's degree", short: "Master's", chartName: "Master's · Computer Science",
      what: "Master's in Computer Science",
      org: "University of Delhi", orgShort: "University of Delhi",
      url: "https://www.du.ac.in/index.php?page=About-DU", site: "du.ac.in",
      fields: ["cs"], main: "cs", cgpa: 8.9,
      body: "Master's degree in Computer Science at the University of Delhi.",
      basis: "Core papers of the M.Sc. (Computer Science) programme, Department of Computer Science, University of Delhi.",
      topics: {
        cs: [
          ["Design and analysis of algorithms", "string processing", "randomised algorithms", "number-theoretic algorithms", "graph algorithms: matching and flows", "parallel and geometric algorithms", "NP-completeness and approximation"],
          ["Artificial intelligence", "intelligent agents", "search and game playing", "knowledge representation", "planning"],
          ["Computational intelligence", "fuzzy logic", "rough sets", "neural networks", "evolutionary computation"],
          ["Information security", "cryptography", "digital signatures", "security threats and mechanisms"],
          ["Database systems and implementation", "storage and indexing", "query processing", "concurrency control", "transactions and recovery"],
          ["Compiler design", "lexical analysis", "parsing", "syntax-directed translation", "type checking"],
          ["Advanced operating systems", "process and processor management", "memory management", "file and I/O management"],
          ["Data mining", "knowledge discovery in databases", "predictive and descriptive techniques", "Bayesian methods"],
          ["Advanced computer networks", "wireless communication", "modulation techniques", "multiple access", "mobile cellular networks"]
        ]
      }
    },
    {
      // Years given by Naeed Akhtar (2016 - 2018).
      when: "2016 – 2018", level: "Master's degree", short: "Master's", chartName: "Master's · Mathematics",
      what: "Master's in Mathematics",
      org: "University of Rajasthan, Jaipur", orgShort: "University of Rajasthan",
      url: "https://uniraj.ac.in/", site: "uniraj.ac.in",
      fields: ["math"], main: "math", cgpa: 9.5,
      body: "Master's degree in Mathematics at the University of Rajasthan, Jaipur.",
      basis: "Papers of the M.A./M.Sc. Mathematics syllabus, University of Rajasthan.",
      topics: {
        math: [
          ["Algebra", "groups: direct products, isomorphism theorems, Sylow theorems", "fields: polynomial rings, extension fields, Galois theory", "linear algebra: dual spaces, eigenvalues, inner product spaces"],
          ["Real analysis", "algebra of sets", "Lebesgue measure and integration", "measurable functions and convergence", "Fourier analysis"],
          ["Topology", "topological spaces", "continuous maps", "separation axioms", "compactness and connectedness", "product and quotient spaces"],
          ["Functional analysis", "metric and normed spaces", "completeness and compactness", "Banach contraction theorem", "Baire category theorem"],
          ["Differential equations", "nonlinear ODEs and the Riccati equation", "series solutions", "second-order PDEs and canonical forms", "Sturm-Liouville problems", "boundary value problems"],
          ["Geometry", "curves and surfaces in 3D: curvature and torsion", "geodesics", "Riemannian geometry and tensor analysis"],
          ["Mechanics and fluids", "dynamics of rigid bodies", "hydrodynamics"],
          ["Calculus of variations and special functions", "functionals and their variations", "Gauss hypergeometric function"],
          ["Integral transforms and equations", "integral transforms", "linear integral equations"]
        ]
      }
    },
    {
      when: "2011 – 2014", level: "Bachelor's degree", short: "Bachelor's", chartName: "Bachelor's",
      what: "Bachelor's in Mathematics, Physics and Computer Science",
      org: "University of Delhi", orgShort: "University of Delhi",
      url: "https://www.du.ac.in/index.php?page=About-DU", site: "du.ac.in",
      fields: ["math", "phys", "cs"], main: null, cgpa: 9.6,
      body: "Bachelor's degree at the University of Delhi, studying Mathematics, Physics and Computer Science together over six semesters.",
      basis: "B.Sc. Physical Sciences course contents (effective 2010-11), University of Delhi: Physics, Mathematics and Computer Science papers.",
      topics: {
        math: [
          ["Calculus and matrices", "vector spaces and linear independence", "geometric transformations", "eigenvalues and eigenvectors", "sequences and recursion", "Taylor and Maclaurin series", "partial derivatives", "complex numbers"],
          ["Calculus and geometry", "limits and continuity", "mean value theorems", "curve tracing", "reduction formulae", "conics and quadric surfaces", "vector-valued functions"],
          ["Algebra", "groups and subgroups", "Lagrange's theorem", "normal subgroups and quotient groups", "rings, integral domains and fields", "vector spaces and linear transformations"],
          ["Differential equations", "first-order and higher-order ODEs", "linear equations and the Wronskian", "variation of parameters", "first-order PDEs", "vibrations and heat conduction"],
          ["Real analysis", "real sequences", "infinite series and convergence tests", "uniform convergence", "power series"],
          ["Mechanics and discrete mathematics", "equilibrium and friction", "projectile motion", "graph theory", "shortest paths and spanning trees", "Kruskal's and Prim's algorithms"]
        ],
        phys: [
          ["Mechanics", "vector calculus: gradient, divergence, curl", "Gauss, Stokes and Green theorems", "conservation laws", "rotational dynamics", "central forces and Kepler's laws", "special relativity"],
          ["Thermal physics", "laws of thermodynamics and entropy", "thermodynamic potentials", "blackbody radiation", "kinetic theory of gases"],
          ["Waves and optics", "simple, damped and forced oscillations", "coupled oscillators", "interference", "diffraction", "polarisation"],
          ["Electricity, magnetism and electromagnetic theory", "Gauss's law", "magnetostatics", "electromagnetic induction", "Maxwell's equations", "electromagnetic waves"],
          ["Quantum mechanics and atomic physics", "wave-particle duality", "Schroedinger equation", "tunnelling", "electron spin", "Zeeman effect", "atomic spectra"],
          ["Solid state and nuclear physics", "crystal structure", "band theory of solids", "superconductivity", "nuclear models", "radioactive decay", "particle physics"]
        ],
        cs: [
          ["Programming in C++", "control structures, arrays, functions, recursion", "pointers and file handling", "object-oriented concepts", "inheritance, polymorphism, exception handling"],
          ["Data structures", "stacks, queues and linked lists", "binary search trees and traversals", "sorting and searching", "complexity analysis"],
          ["Computer system architecture", "logic gates and Boolean algebra", "number representation", "CPU organisation", "assembly language", "input-output"],
          ["Operating systems", "processes and threads", "scheduling and semaphores", "memory management and virtual memory", "file management"],
          ["Computer networks", "OSI and TCP/IP models", "data link and network layers", "IP addressing and routing", "DNS, HTTP and network security"],
          ["Database management systems", "entity-relationship modelling", "relational algebra and SQL", "normal forms"]
        ]
      }
    },
    {
      when: "2008 – 2010", level: "Classes XI–XII", short: "Classes XI–XII", chartName: "Classes XI–XII",
      what: "Classes XI and XII, Science",
      org: "Mayoor School", orgShort: "Mayoor School",
      url: "https://www.mayoorschool.org/", site: "mayoorschool.org",
      fields: ["math", "phys", "cs"], main: null, percent: 87.5, division: "First Division",
      body: "Classes XI and XII in the Science stream at Mayoor School, with Mathematics, Physics and Computer Science.",
      basis: "CBSE senior secondary syllabus for Mathematics, Physics and Computer Science (C++).",
      topics: {
        math: [
          ["Sets, relations and functions", "sets", "relations and functions", "trigonometric and inverse trigonometric functions", "mathematical reasoning"],
          ["Algebra", "mathematical induction", "complex numbers and quadratic equations", "permutations and combinations", "binomial theorem", "sequences and series", "matrices and determinants"],
          ["Coordinate and three-dimensional geometry", "straight lines", "conic sections", "vectors and 3D geometry"],
          ["Calculus", "limits and derivatives", "continuity and differentiability", "applications of derivatives", "integrals and their applications", "differential equations"],
          ["Probability, statistics and optimisation", "probability", "statistics", "linear programming"]
        ],
        phys: [
          ["Mechanics", "kinematics", "laws of motion", "work, energy and power", "rotational motion", "gravitation"],
          ["Properties of matter and heat", "properties of bulk matter", "thermodynamics", "kinetic theory of gases"],
          ["Oscillations and waves", "simple harmonic motion", "wave motion"],
          ["Electricity and magnetism", "electrostatics", "current electricity", "magnetic effects of current", "electromagnetic induction and AC", "electromagnetic waves"],
          ["Optics", "ray optics and optical instruments", "wave optics"],
          ["Modern physics and electronics", "dual nature of radiation and matter", "atoms and nuclei", "electronic devices", "communication systems"]
        ],
        cs: [
          ["Computer fundamentals", "hardware and software", "operating systems", "number systems", "memory"],
          ["Programming and C++", "programming methodology and algorithms", "C++ basics and control flow", "functions", "arrays and structures"],
          ["Object-oriented programming", "classes and objects", "constructors and destructors", "inheritance", "pointers", "data file handling"],
          ["Data structures", "arrays", "stacks", "queues"],
          ["Databases and SQL", "relational model", "SQL commands"],
          ["Boolean algebra", "laws of Boolean algebra", "logic gates"],
          ["Communication and networks", "network concepts"]
        ]
      }
    }
  ];

  // icon: the real logo file in assets/icons (Simple Icons, CC0), used unchanged apart from its colour.
  var PROFILES = [
    { name: "LinkedIn", handle: "naeed-akhtar-4a1882449", url: "https://www.linkedin.com/in/naeed-akhtar-4a1882449/", icon: "assets/icons/linkedin.svg" },
    { name: "GitHub", handle: "naeed-01A", url: "https://github.com/naeed-01A", icon: "assets/icons/github.svg" }
  ];

  var chrono = EDU.slice().reverse(); // oldest first

  /* ---------------- Helpers on the data ---------------- */
  function areasOf(e, f) { return (e.topics && e.topics[f]) || []; }
  function countItems(list) { return list.reduce(function (n, a) { return n + a.length - 1; }, 0); }
  function specialisation(f) { return EDU.filter(function (e) { return e.main === f; })[0]; }

  var totalAreas = 0, totalItems = 0;
  EDU.forEach(function (e) {
    FIELD_KEYS.forEach(function (f) { var l = areasOf(e, f); totalAreas += l.length; totalItems += countItems(l); });
  });

  /* ---------------- Hero numbers and "About" footers come from EDU, so they cannot drift ---------------- */
  function setStat(name, val) {
    var n = $('[data-stat="' + name + '"]');
    if (!n) return;
    n.setAttribute('data-count', String(val));
    n.textContent = String(val);
  }
  var best = 0;
  EDU.forEach(function (e) { if (e.cgpa != null && e.cgpa > best) best = e.cgpa; });
  setStat("masters", EDU.filter(function (e) { return e.level === "Master's degree"; }).length);
  setStat("fields", FIELD_KEYS.length);
  setStat("best", best.toFixed(1));
  // The number of papers comes from assets/papers-data.js (loaded before this file); the HTML keeps the same number as a fallback.
  if (window.PAPERS && window.PAPERS.length) {
    setStat("papers", window.PAPERS.length);
    $$("[data-papers-count]").forEach(function (n) { n.textContent = String(window.PAPERS.length); });
    var paperLink = $(".stat-link");
    if (paperLink) paperLink.setAttribute("aria-label", window.PAPERS.length + " research papers reviewed. Open the full list");
  }
  $$("[data-spec]").forEach(function (n) {
    var s = specialisation(n.getAttribute("data-spec"));
    if (s) n.textContent = "Master's · " + s.orgShort + " · CGPA " + s.cgpa.toFixed(1);
  });

  /* ---------------- Education summary numbers ---------------- */
  var eduStats = $("#edu-stats");
  [
    { n: EDU.length, label: "stages of study", count: true, k: 1 },
    { n: totalAreas, label: "topic areas", count: true, k: 2 },
    { n: totalItems, label: "subtopics", count: true, k: 3 },
    { n: parseInt(chrono[0].when, 10), label: "studying since", count: false, k: 4 }
  ].forEach(function (s) {
    var b = el("b", { text: String(s.n) });
    if (s.count) b.setAttribute("data-count", String(s.n));
    eduStats.appendChild(el("div", { class: "card edu-stat", "data-k": s.k }, [b, el("span", { text: s.label })]));
  });

  /* ---------------- Education timeline ---------------- */
  var tl = $("#timeline");
  var ALL_DETAILS = [];

  function topicBlock(e, f, openIt) {
    var list = e.topics[f];
    var d = el("details", { class: "topic-block", "data-k": FIELDS[f].k, "data-field": f });
    if (openIt) d.setAttribute("open", "");
    d.appendChild(el("summary", {}, [
      el("span", { class: "topic-name", text: FIELDS[f].name }),
      el("span", { class: "topic-count", text: list.length + " areas · " + countItems(list) + " subtopics" })
    ]));
    d.appendChild(el("div", { class: "areas" }, list.map(function (a) {
      return el("div", { class: "area" }, [
        el("h5", { text: a[0] }),
        el("ul", { class: "chips mini" }, a.slice(1).map(function (t) { return el("li", { text: t }); }))
      ]);
    })));
    ALL_DETAILS.push(d);
    return d;
  }

  // What the ring shows for a stage: its CGPA or its percentage (null while the stage is still running).
  function scoreOf(e) {
    if (e.cgpa != null) return { text: e.cgpa.toFixed(1), pct: e.cgpa * 10 };
    if (e.percent != null) return { text: e.percent.toFixed(1) + "%", pct: e.percent };
    return null;
  }

  EDU.forEach(function (e, i) {
    var bodyId = "edu-body-" + i;
    var score = scoreOf(e);
    var ring = el("span", { class: "ring" + (score ? "" : " live"), "aria-hidden": "true" }, [
      el("span", { class: "ring-val" + (e.cgpa == null && score ? " pct" : ""), text: score ? score.text : "Now" })
    ]);
    ring.style.setProperty("--p", score ? String(Math.round(score.pct)) : "100"); // set through the CSSOM, which the page's CSP allows
    var areaCount = 0;
    FIELD_KEYS.forEach(function (f) { areaCount += areasOf(e, f).length; });
    var btn = el("button", { class: "tl-btn", type: "button", "aria-expanded": "false", "aria-controls": bodyId }, [
      el("span", { class: "tl-text" }, [
        el("span", { class: "when", text: e.when }),
        el("span", { class: "what", text: e.what }),
        el("span", { class: "where", text: e.org }),
        el("span", { class: "tl-sum", text: e.fields.length + (e.fields.length === 1 ? " subject" : " subjects") + " · " + areaCount + " topic areas" })
      ]),
      ring
    ]);
    var kids = [el("p", { text: e.body })];
    if (e.basis) kids.push(el("p", { class: "basis", text: "Topics: " + e.basis }));
    kids.push(el("span", { class: "block-label", text: "Topics and subtopics" }));
    var first = true;
    FIELD_KEYS.forEach(function (f) {
      if (!areasOf(e, f).length) return;
      kids.push(topicBlock(e, f, first));
      first = false;
    });
    var meta = el("div", { class: "tl-meta" });
    if (e.cgpa != null) meta.appendChild(el("span", { class: "cgpa-chip" }, [el("b", { text: e.cgpa.toFixed(1) }), document.createTextNode(" CGPA")]));
    else if (e.percent != null) meta.appendChild(el("span", { class: "cgpa-chip" }, [el("b", { text: e.percent.toFixed(2) + "%" }), document.createTextNode(" " + e.division)]));
    meta.appendChild(el("a", { class: "site-link", href: e.url, target: "_blank", rel: "noopener", text: "Visit " + e.site + " ↗" }));
    kids.push(meta);
    var body = el("div", { class: "tl-body", id: bodyId }, kids);
    var li = el("li", { class: "tl-item" }, [btn, body]);
    if (e.main) li.setAttribute("data-k", FIELDS[e.main].k);
    btn.addEventListener("click", function () {
      var open = li.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
    tl.appendChild(li);
  });
  tl.firstChild.classList.add("open");
  $(".tl-btn", tl).setAttribute("aria-expanded", "true");

  function setAllOpen(open) {
    $$(".tl-item", tl).forEach(function (li) {
      li.classList.toggle("open", open);
      $(".tl-btn", li).setAttribute("aria-expanded", String(open));
    });
    ALL_DETAILS.forEach(function (d) { if (open) d.setAttribute("open", ""); else d.removeAttribute("open"); });
  }
  var expandBtn = $("#expand-all"), allOpen = false;
  expandBtn.addEventListener("click", function () {
    allOpen = !allOpen;
    setAllOpen(allOpen);
    expandBtn.textContent = allOpen ? "Collapse all" : "Expand all";
    expandBtn.setAttribute("aria-pressed", String(allOpen));
  });
  window.addEventListener("beforeprint", function () { setAllOpen(true); });

  // Opens one stage (and the topics of one subject) in the education section; used by the skill tabs.
  function openStage(index, field) {
    var li = tl.children[index];
    if (!li) return;
    li.classList.add("open");
    $(".tl-btn", li).setAttribute("aria-expanded", "true");
    var d = field ? $('details[data-field="' + field + '"]', li) : null;
    if (d) d.setAttribute("open", "");
    li.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    $(".tl-btn", li).focus({ preventScroll: true });
  }

  /* ---------------- CGPA chart (out of 10, oldest first) ---------------- */
  var chart = $("#chart-card");
  var cgList = el("ul", { class: "cg-list" });
  chrono.forEach(function (e) {
    if (e.cgpa == null) return;
    var fill = el("span", { class: "cg-fill" });
    fill.style.setProperty("--w", (e.cgpa * 10) + "%");
    var row = el("li", { class: "cg-row" }, [
      el("div", { class: "cg-name" }, [el("span", { text: e.chartName }), el("small", { text: e.orgShort + " · " + e.when })]),
      el("span", { class: "cg-val", text: e.cgpa.toFixed(1) }),
      el("div", { class: "cg-track", "aria-hidden": "true" }, [fill])
    ]);
    if (e.main) row.setAttribute("data-k", FIELDS[e.main].k);
    cgList.appendChild(row);
  });
  var legend = el("ul", { class: "legend", "aria-label": "Colour key" }, FIELD_KEYS.map(function (f) {
    return el("li", { "data-k": FIELDS[f].k, text: FIELDS[f].name });
  }).concat([el("li", { text: "Several subjects" })]));
  var chartParts = [el("h3", { text: "CGPA by stage" }), el("p", { class: "chart-sub", text: "Out of 10, oldest stage first." }), cgList, legend];
  EDU.filter(function (e) { return e.percent != null; }).forEach(function (e) {
    chartParts.push(el("p", { class: "chart-note", text: e.short + ": " + e.percent.toFixed(2) + "% (" + e.division + "). Graded in percentage, so it is not on this chart." }));
  });
  chartParts.forEach(function (n) { chart.appendChild(n); });

  /* ---------------- Skills: one tab per subject, with its path from school to master's level ---------------- */
  var tabsBox = $("#tabs"), panel = $("#tabpanel");

  function skillMeta(f) {
    var mine = chrono.filter(function (e) { return e.fields.indexOf(f) !== -1; });
    var areas = 0;
    mine.forEach(function (e) { areas += areasOf(e, f).length; });
    return { stages: mine, areas: areas, spec: specialisation(f) };
  }

  function renderPanel(key) {
    var f = FIELDS[key], m = skillMeta(key);
    panel.textContent = "";
    panel.setAttribute("data-k", f.k);
    panel.setAttribute("aria-labelledby", "tab-" + key);
    panel.appendChild(el("div", { class: "panel-head" }, [
      el("h3", { text: f.name }),
      el("span", { class: "pill", text: m.stages.length + " stages · " + m.areas + " topic areas" })
    ]));
    if (m.spec) {
      panel.appendChild(el("p", { class: "detail", text: "Studied from " + m.stages[0].short + " to master's level. Master's specialisation: " + m.spec.orgShort + " (" + m.spec.when + "), CGPA " + m.spec.cgpa.toFixed(1) + "." }));
    }
    panel.appendChild(el("p", { class: "relevant" }, [el("strong", { text: "In AI training: " }), document.createTextNode(f.ai)]));
    panel.appendChild(el("span", { class: "block-label", text: "My path in " + f.name }));
    panel.appendChild(el("ol", { class: "path" }, m.stages.map(function (e) {
      var areas = areasOf(e, key);
      var idx = EDU.indexOf(e);
      var go = el("button", { class: "linkish", type: "button", text: "See all " + countItems(areas) + " subtopics ↓" });
      go.addEventListener("click", function () { openStage(idx, key); });
      return el("li", {}, [
        el("div", { class: "path-head" }, [
          el("span", { class: "path-when", text: e.when }),
          el("span", { class: "path-what", text: e.level }),
          el("span", { class: "path-org", text: e.orgShort })
        ]),
        el("ul", { class: "chips" }, areas.map(function (a) { return el("li", { text: a[0] }); })),
        go
      ]);
    })));
  }

  var tabBtns = FIELD_KEYS.map(function (key) {
    var m = skillMeta(key);
    var b = el("button", { class: "skill-tab", role: "tab", type: "button", id: "tab-" + key, "aria-selected": "false", "aria-controls": "tabpanel", tabindex: "-1", "data-k": FIELDS[key].k });
    var ico = el("span", { class: "ico", "aria-hidden": "true" });
    ico.insertAdjacentHTML("beforeend", ICONS[key]);
    b.appendChild(ico);
    b.appendChild(el("b", { text: FIELDS[key].name }));
    b.appendChild(el("span", { class: "meta", text: m.stages.length + " stages · CGPA " + (m.spec ? m.spec.cgpa.toFixed(1) : "-") }));
    tabsBox.appendChild(b);
    return b;
  });
  function selectTab(i, focus) {
    tabBtns.forEach(function (b, j) {
      b.setAttribute("aria-selected", String(i === j));
      b.setAttribute("tabindex", i === j ? "0" : "-1");
    });
    renderPanel(FIELD_KEYS[i]);
    if (focus) tabBtns[i].focus();
  }
  tabBtns.forEach(function (b, i) {
    b.addEventListener("click", function () { selectTab(i, false); });
    b.addEventListener("keydown", function (e) {
      var n = tabBtns.length, next = -1;
      if (e.key === "ArrowRight") next = (i + 1) % n;
      else if (e.key === "ArrowLeft") next = (i - 1 + n) % n;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = n - 1;
      if (next < 0) return;
      e.preventDefault();
      selectTab(next, true);
    });
  });
  selectTab(0, false);

  /* ---------------- Profiles ---------------- */
  var pg = $("#profile-grid");
  PROFILES.forEach(function (p) {
    var logo = el("span", { class: "logo", "aria-hidden": "true" }, [el("img", { src: p.icon, alt: "", width: "34", height: "26" })]);
    pg.appendChild(el("a", { class: "card profile", href: p.url, target: "_blank", rel: "noopener" }, [
      logo,
      el("div", {}, [el("b", { text: p.name }), el("span", { text: p.handle })])
    ]));
  });

  /* ---------------- Active nav link, reveal on scroll, count-up ---------------- */
  if ("IntersectionObserver" in window) {
    var links = {};
    $$("a", nav).forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $$("a", nav).forEach(function (a) { a.classList.remove("active"); });
          links[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$("main section[id]").forEach(function (s) { spy.observe(s); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (n) { io.observe(n); });

    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countIO.unobserve(en.target);
        var end = parseFloat(en.target.getAttribute("data-count"));
        var dec = parseInt(en.target.getAttribute("data-dec") || "0", 10);
        if (reduceMotion) { en.target.textContent = end.toFixed(dec); return; }
        var start = performance.now(), dur = 900;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          en.target.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(dec);
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });
    $$("[data-count]").forEach(function (n) {
      var dec = parseInt(n.getAttribute("data-dec") || "0", 10);
      n.textContent = (0).toFixed(dec);
      countIO.observe(n);
    });
  } else {
    $$(".reveal").forEach(function (n) { n.classList.add("in"); });
  }

  /* ---------------- Copy email ---------------- */
  var copyBtn = $("#copy"), msg = $("#copy-msg"), email = $("#email-link").textContent.trim(), msgTimer;
  function say(text) {
    msg.textContent = text;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { msg.textContent = ""; }, 4000);
  }
  copyBtn.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { say("Email address copied."); }, function () { say(email); });
    } else {
      say(email);
    }
  });
})();

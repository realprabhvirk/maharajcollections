/* Maharaj Collections. Vanilla JS: nav, catalogue, product, bag, lightbox, forms, motion. */
(function () {
  'use strict';

  var P = window.PRODUCTS || [];
  var C = window.COLLECTIONS || {};
  var BAG_KEY = 'mc_bag';
  var PHONE_DISPLAY = '1300 000 000';
  var PHONE_TEL = 'tel:1300000000';
  var EMAIL = 'tajrai@maharajcollections.com.au';
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reduceMotion = function () { return motionQuery.matches; };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function aud(n) { return '$' + Number(n).toLocaleString('en-AU'); }
  function byId(id) { for (var i = 0; i < P.length; i++) { if (P[i].id === id) { return P[i]; } } return null; }
  function params() { try { return new URLSearchParams(window.location.search); } catch (e) { return { get: function () { return null; } }; } }

  function fmtLine(p) {
    var n = p.sizes.length + ' sizes';
    if (p.fmt === 'set') { return n + ' · three-piece set'; }
    if (p.fmt === 'backlit') { return n + ' · backlit'; }
    return n + ' · single piece';
  }
  function pic(p, eager, extraClass) {
    return '<picture><source srcset="images/' + p.img + '.webp" type="image/webp">' +
      '<img' + (extraClass ? ' class="' + extraClass + '"' : '') + ' src="images/' + p.img + '.jpg" alt="' + esc(p.alt) + '" width="' + p.w + '" height="' + p.h + '"' +
      (eager ? ' decoding="async"' : ' loading="lazy" decoding="async"') + '></picture>';
  }

  /* ---------- Live region ---------- */
  var liveEl = null;
  var liveTimer = null;
  function announce(msg) {
    if (!liveEl) {
      liveEl = document.createElement('div');
      liveEl.className = 'live';
      liveEl.setAttribute('role', 'status');
      liveEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveEl);
    }
    liveEl.textContent = '';
    window.setTimeout(function () { liveEl.textContent = msg; liveEl.classList.add('show'); }, 30);
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(function () { liveEl.classList.remove('show'); }, 2600);
  }

  /* ---------- Bag (localStorage, always wrapped) ---------- */
  function getBag() {
    try {
      var raw = window.localStorage.getItem(BAG_KEY);
      var b = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(b)) { return []; }
      return b.filter(function (l) { return l && byId(l.id) && byId(l.id).sizes[l.s] && l.q > 0; });
    } catch (e) { return memoryBag; }
  }
  var memoryBag = [];
  function setBag(b) {
    memoryBag = b;
    try { window.localStorage.setItem(BAG_KEY, JSON.stringify(b)); } catch (e) { /* storage blocked, keep in memory */ }
    renderBagCount();
  }
  function bagCount() { return getBag().reduce(function (a, l) { return a + l.q; }, 0); }
  function renderBagCount() {
    var n = bagCount();
    $$('.bag-count').forEach(function (el) {
      el.textContent = n;
      el.classList.toggle('is-zero', n === 0);
    });
    $$('.bag').forEach(function (el) { el.setAttribute('aria-label', 'Bag, ' + n + (n === 1 ? ' item' : ' items')); });
  }
  function lineInfo(l) {
    var p = byId(l.id), s = p.sizes[l.s];
    var unit = p.from + s[2];
    return { p: p, size: s, unit: unit, total: unit * l.q };
  }
  function addToBag(id, s, q) {
    var p = byId(id);
    if (!p) { return; }
    s = s || 0; q = q || 1;
    var b = getBag(), found = null;
    b.forEach(function (l) { if (l.id === id && l.s === s) { found = l; } });
    if (found) { found.q += q; } else { b.push({ id: id, s: s, q: q }); }
    setBag(b);
    announce('Added to bag: ' + p.name);
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    var btn = $('.menu-btn'), nav = $('#primary-nav');
    var megas = $$('.has-mega');
    var desktop = function () { return window.matchMedia('(min-width: 900px)').matches; };
    var canHover = function () { return window.matchMedia('(hover: hover)').matches; };

    function setMenu(open) {
      if (!btn || !nav) { return; }
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    function setMega(li, open) {
      li.classList.toggle('open', open);
      var t = $('.mega-toggle', li);
      if (t) { t.setAttribute('aria-expanded', String(open)); }
    }
    function closeAll() { megas.forEach(function (li) { setMega(li, false); }); }

    if (btn) {
      btn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    }
    megas.forEach(function (li) {
      var t = $('.mega-toggle', li);
      t.addEventListener('click', function () { setMega(li, !li.classList.contains('open')); });
      li.addEventListener('mouseenter', function () { if (desktop() && canHover()) { setMega(li, true); } });
      li.addEventListener('mouseleave', function () { if (desktop() && canHover()) { setMega(li, false); } });
      li.addEventListener('focusin', function () { if (desktop()) { setMega(li, true); } });
      li.addEventListener('focusout', function (e) {
        if (desktop() && (!e.relatedTarget || !li.contains(e.relatedTarget))) { setMega(li, false); }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-mega')) { closeAll(); }
      if (nav && nav.classList.contains('open') && !e.target.closest('.site-header')) { setMenu(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') { return; }
      var openMega = megas.filter(function (li) { return li.classList.contains('open'); })[0];
      if (openMega) {
        var focusInside = openMega.contains(document.activeElement);
        closeAll();
        if (focusInside) { $('.mega-toggle', openMega).focus(); }
      }
      if (nav && nav.classList.contains('open')) { setMenu(false); if (btn) { btn.focus(); } }
    });
    window.addEventListener('resize', function () { if (desktop()) { setMenu(false); } });
  }

  /* ---------- Same-page anchors ---------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented) { return; }
      var url;
      try { url = new URL(a.href, window.location.href); } catch (err) { return; }
      if (url.pathname !== window.location.pathname || !url.hash || url.hash.length < 2) { return; }
      var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) { return; }
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
      try { window.history.pushState(null, '', url.hash); } catch (err2) { /* file urls can refuse */ }
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ---------- Reveal and count-up ---------- */
  function initReveal(root) {
    if (reduceMotion() || !('IntersectionObserver' in window)) { return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal:not(.pre)', root).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }
  function initCountUp() {
    if (reduceMotion() || !('IntersectionObserver' in window)) { return; }
    var els = $$('[data-count]');
    if (!els.length) { return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        io.unobserve(en.target);
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10), start = null, dur = 1100;
        function step(t) {
          if (start === null) { start = t; }
          var k = Math.min((t - start) / dur, 1), eased = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(end * eased);
          if (k < 1) { window.requestAnimationFrame(step); } else { el.textContent = end; }
        }
        el.textContent = '0';
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Cards ---------- */
  function cardHTML(p, opts) {
    opts = opts || {};
    var c = C[p.cat] ? C[p.cat].name : '';
    return '<article class="card sheen' + (opts.reveal ? ' reveal' : '') + '" data-cat="' + p.cat + '" data-id="' + p.id + '">' +
      '<a class="card-art" href="product.html?id=' + p.id + '" tabindex="-1">' +
      '<div class="frame"><div class="art">' + pic(p, opts.eager) + '</div></div>' +
      (p.tag ? '<span class="badge">' + esc(p.tag) + '</span>' : '') + '</a>' +
      '<p class="card-cat">' + esc(c) + '</p>' +
      '<h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h3>' +
      '<p class="card-fmt">' + fmtLine(p) + '</p>' +
      '<div class="card-foot"><p class="price"><small>From</small><b>' + aud(p.from) + '</b></p>' +
      '<button type="button" class="btn btn--sm" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to bag">Add to bag</button></div>' +
      '</article>';
  }
  function bindAddButtons(root) {
    $$('[data-add]', root).forEach(function (b) {
      b.addEventListener('click', function () { addToBag(b.getAttribute('data-add'), 0, 1); });
    });
  }

  /* ---------- Home ---------- */
  function initHome() {
    var host = $('#bestsellers');
    if (!host) { return; }
    var list = P.filter(function (p) { return p.feat; });
    host.innerHTML = list.map(function (p, i) { return cardHTML(p, { reveal: true, eager: i < 2 }); }).join('');
    bindAddButtons(host);
    initReveal(host);
  }

  /* ---------- Catalogue ---------- */
  function initCatalogue() {
    var grid = $('#catalogue-grid');
    if (!grid) { return; }
    var filters = $('#filters'), countEl = $('#result-count'), sortEl = $('#sort');
    var q = params().get('c');
    var state = { c: C[q] ? q : 'all', sort: 'featured' };

    var chips = [['all', 'All']].concat(Object.keys(C).map(function (k) { return [k, C[k].name]; }));
    filters.innerHTML = chips.map(function (c) {
      return '<button type="button" class="chip" data-c="' + c[0] + '" aria-pressed="false">' + esc(c[1]) + '</button>';
    }).join('');

    function render() {
      var list = P.filter(function (p) { return state.c === 'all' || p.cat === state.c; });
      if (state.sort === 'low') { list = list.slice().sort(function (a, b) { return a.from - b.from; }); }
      if (state.sort === 'high') { list = list.slice().sort(function (a, b) { return b.from - a.from; }); }
      grid.innerHTML = list.map(function (p, i) { return cardHTML(p, { eager: i < 3 }); }).join('');
      bindAddButtons(grid);
      $$('.chip', filters).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-c') === state.c)); });
      var label = state.c === 'all' ? 'across five collections' : 'in ' + C[state.c].name;
      countEl.textContent = 'Showing ' + list.length + (list.length === 1 ? ' piece ' : ' pieces ') + label;
    }
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) { return; }
      state.c = b.getAttribute('data-c');
      try { window.history.replaceState(null, '', state.c === 'all' ? 'catalogue.html' : 'catalogue.html?c=' + state.c); } catch (err) { /* ignore on file urls */ }
      render();
    });
    sortEl.addEventListener('change', function () { state.sort = sortEl.value; render(); });
    render();
  }

  /* ---------- Product page ---------- */
  function setMeta(sel, attr, val) { var el = $(sel); if (el) { el.setAttribute(attr, val); } }
  function absUrl(rel) { try { return new URL(rel, window.location.href).href; } catch (e) { return rel; } }

  function initProduct() {
    var root = $('#pdp-root');
    if (!root) { return; }
    var p = byId(params().get('id') || '');
    if (!p) {
      document.title = 'Piece not found | Maharaj Collections';
      root.innerHTML = '<div class="wrap"><div class="missing"><h1>We couldn’t find that <em>piece.</em></h1>' +
        '<p class="lead">The link may be old, or the design may have left the collection. Every current piece is in the catalogue.</p>' +
        '<a class="btn" href="catalogue.html">Back to the catalogue</a></div></div>';
      return;
    }
    var coll = C[p.cat].name;
    var sel = 0;
    var maxAdd = Math.max.apply(null, p.sizes.map(function (s) { return s[2]; }));
    var desc = p.desc.length > 150 ? p.desc.slice(0, 147).replace(/\s+\S*$/, '') + '...' : p.desc;

    document.title = p.name + ' | Maharaj Collections';
    setMeta('meta[name="description"]', 'content', p.name + ' from the ' + coll + ' collection. From ' + aud(p.from) + ' AUD. ' + desc);
    setMeta('meta[property="og:title"]', 'content', p.name + ' | Maharaj Collections');
    setMeta('meta[property="og:description"]', 'content', p.name + ', from ' + aud(p.from) + ' AUD. Free insured delivery Australia-wide.');
    setMeta('meta[property="og:image"]', 'content', absUrl('images/' + p.img + '.jpg'));
    setMeta('meta[name="twitter:image"]', 'content', absUrl('images/' + p.img + '.jpg'));

    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: p.name,
      image: [absUrl('images/' + p.img + '.jpg')], description: p.desc, brand: { '@type': 'Brand', name: 'Maharaj Collections' },
      category: coll,
      offers: { '@type': 'AggregateOffer', priceCurrency: 'AUD', lowPrice: p.from, highPrice: p.from + maxAdd, offerCount: p.sizes.length, availability: 'https://schema.org/InStock' }
    });
    document.head.appendChild(ld);

    var sizesHTML = p.sizes.map(function (s, i) {
      return '<div class="size"><input type="radio" name="size" id="size-' + i + '" value="' + i + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<label for="size-' + i + '"><b>' + esc(s[0]) + '</b><small>' + esc(s[1]) + '</small><span class="sz-price">' + aud(p.from + s[2]) + '</span></label></div>';
    }).join('');

    var backlit = p.fmt === 'backlit' ?
      '<p class="note-box">LED wiring is included in the $149 professional install, available in Melbourne and Sydney metro.</p>' : '';

    root.innerHTML =
      '<div class="wrap">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="catalogue.html">Shop</a> / <a href="catalogue.html?c=' + p.cat + '">' + esc(coll) + '</a> / <span>' + esc(p.name) + '</span></nav>' +
      '<div class="pdp">' +
      '<div class="pdp-media"><div class="frame sheen"><button type="button" class="zoom-btn" data-zoom aria-label="Enlarge image of ' + esc(p.name) + '">' +
      '<div class="art">' + pic(p, true) + '</div><span class="zoom-hint" aria-hidden="true">Enlarge</span></button></div></div>' +
      '<div class="pdp-info">' +
      '<div><p class="eyebrow"><a class="text-link" href="catalogue.html?c=' + p.cat + '">' + esc(coll) + '</a>' + (p.tag ? ' · ' + esc(p.tag) : '') + '</p>' +
      '<h1 id="pdp-title">' + esc(p.name) + '</h1></div>' +
      '<div class="pdp-price"><p class="amount" id="pdp-amount" aria-live="polite">' + aud(p.from) + '</p><small id="pdp-dims">' + esc(p.sizes[0][0]) + ' · ' + esc(p.sizes[0][1]) + ' · AUD incl. GST</small></div>' +
      '<fieldset><legend>Size</legend><div class="sizes">' + sizesHTML + '</div></fieldset>' +
      '<div class="pdp-actions"><button type="button" class="btn" id="pdp-add">Add to bag</button><a class="btn btn--ghost" href="order.html">View bag</a></div>' +
      '<p class="note-box">Free insured delivery Australia-wide, dispatched in 5 to 7 days. <a class="text-link" href="contact.html">Need a custom size?</a></p>' +
      backlit +
      '<p>' + esc(p.desc) + '</p>' +
      '<p class="spec">' + esc(p.spec) + '</p>' +
      '<p class="spec">Materials: tempered crystal-porcelain glass, gallery canvas and carved sandstone composite, framed in brushed aluminium.</p>' +
      '<details class="acc"><summary>Delivery, returns and warranty</summary><div class="acc-body">' +
      '<p><b>Delivery.</b> Dispatched in 5 to 7 days from our warehouse, fully insured and free Australia-wide. Metro addresses get white-glove delivery: carried in, unpacked and the packaging taken away.</p>' +
      '<p><b>Returns.</b> 30 days, in original packaging, for a full refund.</p>' +
      '<p><b>Installation.</b> A hanging kit with spacing template and concealed mounts is in every box. Professional install is $149 in Melbourne and Sydney metro.</p>' +
      '<p><b>Warranty.</b> 5 years on frames, mounts and LED drivers.</p>' +
      '</div></details></div></div></div>';

    var amount = $('#pdp-amount'), dims = $('#pdp-dims');
    $$('input[name="size"]', root).forEach(function (r) {
      r.addEventListener('change', function () {
        sel = parseInt(r.value, 10);
        var s = p.sizes[sel];
        amount.textContent = aud(p.from + s[2]);
        dims.textContent = s[0] + ' · ' + s[1] + ' · AUD incl. GST';
      });
    });
    $('#pdp-add').addEventListener('click', function () { addToBag(p.id, sel, 1); });
    $('[data-zoom]', root).addEventListener('click', function (e) { openLightbox(p, e.currentTarget); });

    var rel = P.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    var relHost = $('#related-root');
    if (relHost && rel.length) {
      relHost.innerHTML = '<div class="wrap"><div class="sec-head"><h2>From the same <em>collection.</em></h2></div>' +
        '<div class="grid">' + rel.map(function (x, i) { return cardHTML(x, {}); }).join('') + '</div></div>';
      bindAddButtons(relHost);
      relHost.hidden = false;
    }
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(p, trigger) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Enlarged image of ' + p.name);
    lb.innerHTML = '<div class="lb-bar"><p>' + esc(p.name) + '</p><div class="btn-row">' +
      '<button type="button" class="lb-zoom" aria-pressed="false">Zoom</button>' +
      '<button type="button" class="lb-close" aria-label="Close enlarged image">Close</button></div></div>' +
      '<div class="lb-stage"><picture><source srcset="images/' + p.img + '.webp" type="image/webp"><img src="images/' + p.img + '.jpg" alt="' + esc(p.alt) + '" width="' + p.w + '" height="' + p.h + '"></picture></div>';
    document.body.appendChild(lb);
    document.body.classList.add('lb-open');
    var closeBtn = $('.lb-close', lb), zoomBtn = $('.lb-zoom', lb), img = $('img', lb);

    function toggleZoom() {
      var z = lb.classList.toggle('zoomed');
      zoomBtn.setAttribute('aria-pressed', String(z));
    }
    function close() {
      document.removeEventListener('keydown', onKey, true);
      lb.remove();
      document.body.classList.remove('lb-open');
      if (trigger) { trigger.focus(); }
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') {
        var f = [zoomBtn, closeBtn];
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey) { if (i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } }
        else if (i === f.length - 1 || i === -1) { e.preventDefault(); f[0].focus(); }
      }
    }
    closeBtn.addEventListener('click', close);
    zoomBtn.addEventListener('click', toggleZoom);
    img.addEventListener('click', toggleZoom);
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) { close(); } });
    document.addEventListener('keydown', onKey, true);
    closeBtn.focus();
  }

  /* ---------- Forms ---------- */
  function fieldError(input, msg) {
    var wrap = input.closest('.field');
    var err = $('.err', wrap);
    if (!err) {
      err = document.createElement('span');
      err.className = 'err';
      err.id = input.id + '-err';
      wrap.appendChild(err);
    }
    if (msg) {
      err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', err.id);
    } else {
      err.remove();
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }
  function validate(form) {
    var first = null;
    $$('[data-req]', form).forEach(function (input) {
      var v = input.value.trim(), msg = '';
      var kind = input.getAttribute('data-req');
      if (!v) { msg = input.getAttribute('data-msg') || 'This one is needed so we can reply.'; }
      else if (kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg = 'That email doesn’t look right. It should read like name@example.com.'; }
      else if (kind === 'min10' && v.length < 10) { msg = 'A sentence or two helps us give you a useful answer.'; }
      fieldError(input, msg);
      if (msg && !first) { first = input; }
    });
    return first;
  }
  function showFormMessage(form, kind, title, bodyHTML) {
    var box = form.parentNode.querySelector('.form-result');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-result';
      box.setAttribute('tabindex', '-1');
      form.parentNode.insertBefore(box, form);
    }
    box.innerHTML = '<div class="form-msg' + (kind === 'error' ? ' is-error' : '') + '"><h3>' + title + '</h3>' + bodyHTML + '</div>';
    box.hidden = false;
    box.focus();
    return box;
  }
  function contactFallback() {
    return '<p>Call <a class="text-link" href="' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a> or email <a class="text-link" href="mailto:' + EMAIL + '">' + EMAIL + '</a>, Monday to Saturday, 10am to 6pm.</p>';
  }
  function initForm(form, onSuccess) {
    form.setAttribute('novalidate', '');
    $$('[data-req]', form).forEach(function (input) {
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) { fieldError(input, ''); } });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate(form);
      if (bad) { bad.focus(); return; }
      if (form.hasAttribute('data-before')) { form.dispatchEvent(new CustomEvent('mc:before')); }
      if (window.location.protocol === 'file:') {
        showFormMessage(form, 'error', 'This form goes live once the site is deployed.',
          '<p>You are viewing a local copy, so nothing was sent. Until then, reach us directly.</p>' + contactFallback());
        return;
      }
      var submit = $('button[type="submit"]', form);
      var label = submit.textContent;
      submit.disabled = true; submit.textContent = 'Sending...';
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (res) {
          if (!res.ok) { throw new Error('status ' + res.status); }
          form.hidden = true;
          var box = onSuccess(form);
          if (box) { box.focus(); }
        })
        .catch(function () {
          showFormMessage(form, 'error', 'That didn’t send.',
            '<p>Your message is still in the form, so nothing is lost. Try again in a moment, or reach us directly.</p>' + contactFallback());
        })
        .then(function () { submit.disabled = false; submit.textContent = label; });
    });
  }
  function initContact() {
    var form = $('#enquiry-form');
    if (!form) { return; }
    var type = params().get('type');
    var sel = $('#enquiry-type');
    if (type === 'showroom' && sel) { sel.value = 'Showroom appointment'; }
    initForm(form, function (f) {
      var name = $('#enq-name', f).value.trim().split(/\s+/)[0];
      return showFormMessage(f, 'ok', 'Thank you, ' + esc(name) + '.',
        '<p>Your enquiry is with Taj. Expect a reply within one working day, Monday to Saturday.</p>' +
        '<p><a class="text-link" href="catalogue.html">Keep browsing the collection</a></p>');
    });
  }

  /* ---------- Bag page ---------- */
  function orderText() {
    var b = getBag(), total = 0;
    var lines = b.map(function (l) {
      var x = lineInfo(l);
      total += x.total;
      return l.q + ' x ' + x.p.name + ' (' + x.size[0] + ', ' + x.size[1] + ') at ' + aud(x.unit) + ' = ' + aud(x.total);
    });
    return lines.join('\n') + '\nTotal: ' + aud(total) + ' AUD incl. GST';
  }
  function initBag() {
    var root = $('#bag-root');
    if (!root) { return; }
    var form = $('#order-form');

    function render() {
      var b = getBag();
      var reqBox = $('#request-box');
      if (!b.length) {
        root.innerHTML = '<div class="empty"><h2>Your bag is empty.</h2><p class="lead">Every piece in the catalogue ships free, insured, Australia-wide.</p><a class="btn" href="catalogue.html">Browse the catalogue</a></div>';
        if (reqBox && !reqBox.hasAttribute('data-done')) { reqBox.hidden = true; }
        return;
      }
      if (reqBox) { reqBox.hidden = false; }
      var total = 0;
      var rows = b.map(function (l, i) {
        var x = lineInfo(l);
        total += x.total;
        var opts = x.p.sizes.map(function (s, si) {
          return '<option value="' + si + '"' + (si === l.s ? ' selected' : '') + '>' + esc(s[0]) + ' · ' + esc(s[1]) + ' · ' + aud(x.p.from + s[2]) + '</option>';
        }).join('');
        return '<li class="line" data-i="' + i + '" data-cat="' + x.p.cat + '">' +
          '<a class="line-img" href="product.html?id=' + x.p.id + '" tabindex="-1"><picture><source srcset="images/' + x.p.img + '.webp" type="image/webp"><img src="images/' + x.p.img + '.jpg" alt="' + esc(x.p.alt) + '" width="88" height="88" loading="lazy" decoding="async"></picture></a>' +
          '<h3><a href="product.html?id=' + x.p.id + '">' + esc(x.p.name) + '</a></h3>' +
          '<div class="line-ctl">' +
          '<label class="vh" for="size-' + i + '">Size for ' + esc(x.p.name) + '</label><select id="size-' + i + '" data-act="size">' + opts + '</select>' +
          '<div class="qty" role="group" aria-label="Quantity for ' + esc(x.p.name) + '"><button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button><output aria-live="polite">' + l.q + '</output><button type="button" data-act="inc" aria-label="Increase quantity">+</button></div>' +
          '<button type="button" class="link-btn" data-act="remove">Remove</button>' +
          '<span class="line-price">' + aud(x.total) + '</span></div></li>';
      }).join('');
      root.innerHTML = '<ul class="lines">' + rows + '</ul>' +
        '<div class="total-row"><span>Order total (AUD incl. GST)</span><b>' + aud(total) + '</b></div>' +
        '<p class="lead">Free insured delivery Australia-wide.</p>';
    }
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn || btn.tagName === 'SELECT') { return; }
      var li = btn.closest('.line'), i = parseInt(li.getAttribute('data-i'), 10);
      var b = getBag(), act = btn.getAttribute('data-act');
      if (act === 'inc') { b[i].q += 1; }
      if (act === 'dec') { b[i].q -= 1; if (b[i].q < 1) { b.splice(i, 1); } }
      if (act === 'remove') { announce('Removed from bag: ' + byId(b[i].id).name); b.splice(i, 1); }
      setBag(b); render();
    });
    root.addEventListener('change', function (e) {
      if (e.target.getAttribute('data-act') !== 'size') { return; }
      var li = e.target.closest('.line'), i = parseInt(li.getAttribute('data-i'), 10);
      var b = getBag(), ns = parseInt(e.target.value, 10);
      b[i].s = ns;
      for (var k = 0; k < b.length; k++) {
        if (k !== i && b[k].id === b[i].id && b[k].s === ns) { b[k].q += b[i].q; b.splice(i, 1); break; }
      }
      setBag(b); render();
    });
    render();

    if (form) {
      form.addEventListener('mc:before', function () { $('#order-field', form).value = orderText(); });
      form.setAttribute('data-before', '');
      initForm(form, function (f) {
        var name = $('#ord-name', f).value.trim().split(/\s+/)[0];
        $('#request-box').setAttribute('data-done', '');
        setBag([]); render();
        return showFormMessage(f, 'ok', 'Request received, ' + esc(name) + '.',
          '<p>Taj will be in touch within one working day to confirm sizes, delivery to your suburb and the next steps. No payment has been taken.</p>' +
          '<p><a class="text-link" href="catalogue.html">Back to the catalogue</a></p>');
      });
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    renderBagCount();
    initNav();
    initAnchors();
    initHome();
    initCatalogue();
    initProduct();
    initBag();
    initContact();
    initReveal(document);
    initCountUp();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
  window.addEventListener('storage', renderBagCount);
})();

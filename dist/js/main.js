/* LADESAR · site behaviour */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  function isoDate(d) {
    var tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0, 10);
  }
  function addDays(d, n) { var c = new Date(d); c.setDate(c.getDate() + n); return c; }
  function formatDate(value) {
    return new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function formatINR(n) { return '₹' + n.toLocaleString('en-IN'); }

  /* ---------- Launch countdown ---------- */
  var launch = $('#launch');
  if (launch) {
    var target = new Date(launch.getAttribute('data-launch')).getTime();
    var units = {};
    $$('[data-unit]', launch).forEach(function (el) { units[el.getAttribute('data-unit')] = el; });

    if (store('ladesar-launch-dismissed') === '1' || isNaN(target) || target <= Date.now()) {
      launch.hidden = true;
    } else {
      var tick = function () {
        var diff = Math.max(0, target - Date.now());
        if (diff === 0) { launch.hidden = true; return; }
        var s = Math.floor(diff / 1000);
        units.d.textContent = Math.floor(s / 86400);
        units.h.textContent = String(Math.floor(s / 3600) % 24).padStart(2, '0');
        units.m.textContent = String(Math.floor(s / 60) % 60).padStart(2, '0');
        units.s.textContent = String(s % 60).padStart(2, '0');
      };
      tick();
      setInterval(tick, 1000);
    }
    $('.launch__close', launch).addEventListener('click', function () {
      launch.hidden = true;
      store('ladesar-launch-dismissed', '1');
    });
  }

  /* ---------- Header state ---------- */
  var header = $('#site-header');
  var onScrollHeader = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Mobile navigation ---------- */
  var nav = $('#nav');
  var toggle = $('.nav-toggle');
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', function (mq) { if (mq.matches) setNav(false); });

  /* Highlight the current section in the nav */
  var navLinks = $$('.nav__list a');
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var section = $(a.getAttribute('href'));
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Hero scene: stars, diyas, parallax ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var stars = $('#stars');
  if (stars) {
    var seed = 7;
    var rand = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (var i = 0; i < 90; i++) {
      var c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', (rand() * 1600).toFixed(1));
      c.setAttribute('cy', (rand() * 480).toFixed(1));
      c.setAttribute('r', (rand() * 1.3 + 0.3).toFixed(2));
      c.setAttribute('opacity', (rand() * 0.6 + 0.2).toFixed(2));
      if (i % 6 === 0) c.setAttribute('class', 'flicker');
      stars.appendChild(c);
    }
  }
  var diyas = $('#diyas');
  if (diyas) {
    for (var x = 540; x <= 1060; x += 40) {
      var halo = document.createElementNS(SVG_NS, 'circle');
      halo.setAttribute('cx', x); halo.setAttribute('cy', 810); halo.setAttribute('r', 14);
      halo.setAttribute('fill', 'url(#halo)'); halo.setAttribute('class', 'flicker');
      halo.style.animationDelay = (-(x % 7)) + 's';
      var flame = document.createElementNS(SVG_NS, 'circle');
      flame.setAttribute('cx', x); flame.setAttribute('cy', 810); flame.setAttribute('r', 2.2);
      flame.setAttribute('fill', '#FFD797');
      diyas.appendChild(halo); diyas.appendChild(flame);
    }
  }

  var layers = $$('.hero__scene .parallax');
  var hero = $('.hero');
  if (layers.length && !reduceMotion) {
    var ticking = false;
    var applyParallax = function () {
      var y = window.scrollY;
      if (y < hero.offsetHeight * 1.2) {
        layers.forEach(function (layer) {
          var speed = parseFloat(layer.getAttribute('data-speed')) || 0;
          layer.style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
        });
      }
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
  }

  var today = new Date();
  $$('input[type="date"]').forEach(function (f) { f.min = isoDate(today); });

  /* ---------- Room booking (step 1) ---------- */
  var bookingForm = $('#booking-form');
  if (bookingForm) {
  var checkIn = $('#bk-in');
  var checkOut = $('#bk-out');
  var roomCount = $('#bk-rooms');
  var rate = parseInt(bookingForm.getAttribute('data-rate'), 10);
  var bookingError = $('#booking-error');
  var dialog = $('#booking-dialog');

  checkIn.min = isoDate(today);
  checkOut.min = isoDate(addDays(today, 1));
  checkIn.addEventListener('change', function () {
    if (!checkIn.value) return;
    var next = isoDate(addDays(new Date(checkIn.value + 'T00:00:00'), 1));
    checkOut.min = next;
    if (!checkOut.value || checkOut.value < next) checkOut.value = next;
  });

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    bookingError.textContent = '';
    [checkIn, checkOut].forEach(function (f) { f.removeAttribute('aria-invalid'); });

    if (!checkIn.value || !checkOut.value) {
      bookingError.textContent = 'Please choose your check-in and check-out dates.';
      (checkIn.value ? checkOut : checkIn).setAttribute('aria-invalid', 'true');
      (checkIn.value ? checkOut : checkIn).focus();
      return;
    }
    if (checkOut.value <= checkIn.value) {
      bookingError.textContent = 'Check-out must be after check-in.';
      checkOut.setAttribute('aria-invalid', 'true');
      checkOut.focus();
      return;
    }

    var nights = Math.round((new Date(checkOut.value) - new Date(checkIn.value)) / 86400000);
    var rooms = parseInt(roomCount.value, 10);
    var adults = $('#bk-adults').value;
    var children = $('#bk-children').value;
    var guests = adults + (adults === '1' ? ' adult' : ' adults') + (children !== '0' ? ', ' + children + (children === '1' ? ' child' : ' children') : '');

    var rows = [
      ['Check-in', formatDate(checkIn.value)],
      ['Check-out', formatDate(checkOut.value)],
      ['Guests', guests],
      ['Stay', rooms + (rooms === 1 ? ' room' : ' rooms') + ' · ' + nights + (nights === 1 ? ' night' : ' nights')]
    ];
    var summary = $('#booking-summary');
    summary.innerHTML = '';
    rows.forEach(function (r) {
      var d = document.createElement('div');
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      d.appendChild(dt); d.appendChild(dd); summary.appendChild(d);
    });
    if (rate) {
      var t = document.createElement('div'); t.className = 'summary__total';
      t.innerHTML = '<dt>Estimated total</dt><dd></dd>';
      t.querySelector('dd').textContent = formatINR(rate * rooms * nights) + ' + taxes';
      summary.appendChild(t);
    }

    var dForm = $('form', dialog);
    dForm.reset();
    $('.form-status', dForm).textContent = '';
    $('.form-status', dForm).className = 'form-status';
    dForm.hidden = false;
    // Travels with the request to email and WhatsApp.
    $('[name="stay"]', dForm).value = $$('div', summary).map(function (d) {
      return $('dt', d).textContent + ': ' + $('dd', d).textContent;
    }).join('\n');

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      $('#dl-name').focus();
    } else {
      dialog.setAttribute('open', '');
    }
  });
  $$('[data-close]', dialog).forEach(function (b) { b.addEventListener('click', function () { dialog.close(); }); });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  /* ---------- Restaurant reservation ---------- */
  var tableDate = $('#tb-date');
  var tableTime = $('#tb-time');
  if (tableTime) (function buildSlots() {
    var groups = [['Lunch', 12 * 60 + 30, 15 * 60], ['Dinner', 19 * 60, 22 * 60 + 30]];
    groups.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g[0];
      for (var m = g[1]; m <= g[2]; m += 30) {
        var o = document.createElement('option');
        var hh = String(Math.floor(m / 60)).padStart(2, '0');
        var mm = String(m % 60).padStart(2, '0');
        o.value = hh + ':' + mm;
        o.textContent = hh + ':' + mm;
        og.appendChild(o);
      }
      tableTime.appendChild(og);
    });
  })();

  /* ---------- Form submission: email (Netlify Forms) + WhatsApp ---------- */
  var MESSAGES = {
    booking: 'Thank you. Your request has reached our reservations team, and we will confirm your stay by phone or email shortly.',
    table: 'Thank you. Your table request has been received, and we will confirm by phone or email.',
    event: 'Thank you for thinking of Ladesar. Our events team will be in touch within one working day.',
    contact: 'Thank you for writing to us. We will reply within a few hours.',
    interest: 'Thank you. We will be in touch before reservations open on 12 October.'
  };
  var TITLES = {
    booking: 'Room reservation request',
    table: 'Table reservation request',
    event: 'Event enquiry',
    contact: 'Message from the website',
    interest: 'Registration of interest'
  };
  var whatsappNumber = document.body.getAttribute('data-whatsapp');
  var hosted = /^https?:$/.test(location.protocol);

  function fieldLabel(f) {
    var label = f.id && $('label[for="' + f.id + '"]');
    if (!label) return f.name;
    var copy = label.cloneNode(true);
    $$('.optional', copy).forEach(function (o) { o.remove(); });
    return copy.textContent.trim();
  }

  function whatsappText(form) {
    var lines = ['*' + (TITLES[form.dataset.form] || 'Website enquiry') + '*'];
    var stay = $('[name="stay"]', form);
    if (stay && stay.value) lines.push(stay.value);
    $$('input, select, textarea', form).forEach(function (f) {
      if (f.type === 'hidden' || f.classList.contains('hp') || !f.value.trim()) return;
      lines.push(fieldLabel(f) + ': ' + (f.type === 'date' ? formatDate(f.value) : f.value.trim()));
    });
    return lines.join('\n');
  }

  $$('.js-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = $('.form-status', form);
      status.className = 'form-status';
      status.textContent = '';

      var fields = $$('input, select, textarea', form).filter(function (f) { return !f.classList.contains('hp') && f.type !== 'hidden'; });
      var firstInvalid = null;
      fields.forEach(function (f) {
        var ok = f.checkValidity();
        if (ok) f.removeAttribute('aria-invalid'); else f.setAttribute('aria-invalid', 'true');
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        status.classList.add('is-error');
        status.textContent = 'Please complete the highlighted fields.';
        firstInvalid.focus();
        return;
      }
      if ($('.hp', form) && $('.hp', form).value) return; // spam trap

      // WhatsApp must open inside the click itself, or browsers block it as a pop-up.
      var openedWhatsApp = false;
      if (whatsappNumber) {
        var url = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(whatsappText(form));
        window.open(url, '_blank', 'noopener');
        openedWhatsApp = true;
      }

      var done = function () {
        status.classList.add('is-success');
        status.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span></span>';
        $('span', status).textContent = (MESSAGES[form.dataset.form] || 'Thank you.') +
          (openedWhatsApp ? ' WhatsApp has opened with your details: press Send to reach us directly.' : '');
        form.reset();
        if (tableTime) tableTime.value = '';
      };

      // Netlify Forms emails each submission. Opened from disk (file://) there is nothing to post to.
      if (!hosted) { done(); return; }
      var btn = $('button[type="submit"]', form);
      btn.disabled = true;
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      })
        .then(function (res) { if (!res.ok) throw new Error(res.status); done(); })
        .catch(function () {
          status.classList.add('is-error');
          var phone = $('.contact__list a[href^="tel:"]');
          status.textContent = 'We could not send your details by email just now. ' +
            (openedWhatsApp ? 'Please press Send in WhatsApp, or call us' : 'Please call us') +
            (phone ? ' on ' + phone.textContent : '') + '.';
        })
        .then(function () { btn.disabled = false; });
    });

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) e.target.removeAttribute('aria-invalid');
    });
  });

  /* ---------- Menu tabs ---------- */
  var tabs = $$('[role="tab"]');
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next); next.focus(); }
    });
  });

  var printBtn = $('#print-menu');
  if (printBtn) printBtn.addEventListener('click', function () {
    document.body.classList.add('print-menu');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-menu'); });

  /* ---------- Gallery filter ---------- */
  var filterBtns = $$('[data-filter]');
  var tiles = $$('#gallery-grid .tile');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      tiles.forEach(function (tile) {
        var show = cat === 'all' || tile.getAttribute('data-cat') === cat;
        if (show) {
          tile.hidden = false;
          window.requestAnimationFrame(function () { tile.classList.remove('is-hiding'); });
        } else {
          tile.classList.add('is-hiding');
          window.setTimeout(function () { if (tile.classList.contains('is-hiding')) tile.hidden = true; }, reduceMotion ? 0 : 400);
        }
      });
    });
  });

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();

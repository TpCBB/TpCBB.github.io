// Adapted from Sakuga VFX Tabs (MIT) + Instant In-Memory Prefetch & Client-Side Navigation.
// Keeps hrefs, browser history, modified clicks, Fancybox, and keyboard accessibility intact.
(() => {
  const menu = document.querySelector('#menu.sakuga-nav');
  const fx = window.SakugaFX;
  const links = menu ? [...menu.querySelectorAll('a[rel="section"]')] : [];

  let current = menu ? menu.querySelector('[aria-current]') : null;
  let target = null;
  let hover = null;
  let frame = 0;
  let last = 0;
  let trackWidth = 0;
  let move = () => {};

  if (menu && fx && links.length) {
    const track = document.createElement('li');
    track.className = 'nav-indicator-track';
    track.setAttribute('aria-hidden', 'true');
    menu.prepend(track);

    const x = new fx.Spring(0, 320, 23);
    const w = new fx.Spring(0, 320, 26);

    function draw() {
      const stretch = fx.calm ? 0 : Math.min(18, Math.abs(x.v) * 0.025);
      const rawLeft = x.x - (x.v > 0 ? stretch : 0);
      const left = Math.max(0, Math.min(rawLeft, trackWidth));
      const right = Math.min(trackWidth, rawLeft + w.x + stretch);
      menu.style.setProperty('--tab-x', `${left}px`);
      menu.style.setProperty('--tab-w', `${Math.max(0, right - left)}px`);
    }

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.034);
      last = now;
      x.step(dt);
      w.step(dt);
      if (Math.abs(x.x - x.to) + Math.abs(w.x - w.to) + Math.abs(x.v) + Math.abs(w.v) < 1 || fx.calm) {
        x.x = x.to;
        w.x = w.to;
        x.v = w.v = 0;
        frame = 0;
        draw();
        return;
      }
      draw();
      frame = requestAnimationFrame(tick);
    }

    move = function (instant = false) {
      const link = hover || (links.includes(document.activeElement) && document.activeElement) || current;
      if (target && target !== link) target.classList.remove('is-preview');
      target = link;
      if (!link || !menu.offsetWidth) {
        menu.classList.remove('has-indicator');
        return;
      }
      const start = !menu.classList.contains('has-indicator');
      link.classList.add('is-preview');
      const box = menu.getBoundingClientRect();
      const item = link.getBoundingClientRect();
      trackWidth = box.width;
      x.to = item.left - box.left - menu.clientLeft;
      w.to = item.width + 2 * menu.clientLeft;
      if (start || instant || fx.calm) {
        cancelAnimationFrame(frame);
        frame = 0;
        x.x = x.to;
        w.x = w.to;
        x.v = w.v = 0;
        draw();
      } else if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
      menu.classList.add('has-indicator');
    };

    links.forEach((link, i) => {
      link.addEventListener('pointerenter', e => {
        if (e.pointerType === 'mouse') {
          hover = link;
          move();
        }
      });
      link.addEventListener('focus', () => {
        hover = null;
        move();
      });
      link.addEventListener('keydown', e => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const index = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: links.length - 1 }[e.key];
        if (index === undefined) return;
        e.preventDefault();
        links[(index + links.length) % links.length].focus();
      });
    });

    menu.addEventListener('pointerleave', () => {
      hover = null;
      move();
    });
    menu.addEventListener('focusout', () => requestAnimationFrame(() => move()));

    document.addEventListener('pointerdown', e => {
      const link = e.target.closest('.post-button a.btn, #menu a[rel="section"]');
      if (!link || e.button !== 0 || fx.calm) return;
      const p = fx.at(link, 0.8, 0);
      fx.ticks(p.x, p.y - 5, { dir: -Math.PI / 2, n: 3, len: 11 });
      fx.puff(p.x + 8, p.y, { size: 6, n: 3, life: 0.35 });
    });

    move(true);
    document.fonts?.ready?.then(() => move(true));
    if (window.ResizeObserver) new ResizeObserver(() => move(true)).observe(menu);
    window.addEventListener('pageshow', () => {
      hover = null;
      move(true);
    });
  }

  function matchMenuSection(pathname) {
    if (!links.length) return null;
    const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
    let matched = null;
    for (const link of links) {
      const linkPath = new URL(link.href, location.origin).pathname.replace(/\/+$/, '') || '/';
      if (linkPath !== '/' && (cleanPath === linkPath || cleanPath.startsWith(linkPath + '/'))) {
        matched = link;
        break;
      }
    }
    if (!matched) {
      matched = links.find(l => (new URL(l.href, location.origin).pathname.replace(/\/+$/, '') || '/') === '/') || links[0];
    }
    return matched;
  }

  function syncMenuActive(pathname, instant = false) {
    if (!links.length) return;
    const nextActive = matchMenuSection(pathname);
    links.forEach(l => {
      if (l === nextActive) l.setAttribute('aria-current', 'location');
      else l.removeAttribute('aria-current');
    });
    current = nextActive;
    hover = null;
    move(instant);
  }

  // ───────── Instant In-Memory Prefetch & Client-Side Navigation ─────────
  const NON_HTML_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|pdf|zip|gz|mp4|mp3|xml|json|txt|css|js)$/i;
  const CACHE_TTL = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 45000 : 300000;
  const MAX_CACHE = 28;
  const pageCache = new Map();
  let inflightNavId = 0;
  let hoverTimer = 0;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isDataSaver = () => Boolean(conn && (conn.saveData || (conn.effectiveType && conn.effectiveType.includes('2g'))));

  let toastTimer = 0;
  function showNeoToast(msg, isError = false) {
    let toast = document.querySelector('.neo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'neo-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.toggle('neo-toast-error', Boolean(isError));
    toast.classList.add('neo-toast-show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('neo-toast-show');
    }, 3200);
  }
  window.showNeoToast = showNeoToast;

  window.addEventListener('online', () => {
    showNeoToast('⚡ 网络已恢复连接');
  });
  window.addEventListener('offline', () => {
    showNeoToast('📡 当前网络已断开，正为您载入离线缓存', true);
  });

  function cacheKey(urlObj) {
    return urlObj.origin + urlObj.pathname + urlObj.search;
  }

  function parseEligibleUrl(anchor, clickEvent) {
    if (!anchor || !anchor.href) return null;
    if (anchor.hasAttribute('download') || anchor.hasAttribute('data-no-instant')) return null;
    const targetAttr = anchor.getAttribute('target');
    if (targetAttr && targetAttr !== '_self') return null;
    if (anchor.classList.contains('fancybox') || anchor.closest('.fancybox, .post-toc')) return null;

    const rawHref = anchor.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      return null;
    }

    let url;
    try {
      url = new URL(anchor.href, location.href);
    } catch (e) {
      return null;
    }

    if (url.origin !== location.origin) {
      if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') && url.hostname === 'tpc28yo.xyz') {
        url = new URL(url.pathname + url.search + url.hash, location.origin);
      } else {
        return null;
      }
    }
    if (NON_HTML_EXT.test(url.pathname)) return null;

    // Same-document hash jump should stay native
    if (url.pathname === location.pathname && url.search === location.search && url.hash) {
      return null;
    }

    if (clickEvent) {
      if (
        clickEvent.defaultPrevented ||
        clickEvent.button !== 0 ||
        clickEvent.metaKey ||
        clickEvent.ctrlKey ||
        clickEvent.shiftKey ||
        clickEvent.altKey
      ) {
        return null;
      }
    }

    return url;
  }

  function fetchPageHtml(urlObj) {
    const key = cacheKey(urlObj);
    const now = Date.now();
    const hit = pageCache.get(key);
    if (hit && now - hit.time < CACHE_TTL) {
      return hit.promise;
    }

    const promise = fetch(key, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'text/html' }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (ct && !ct.includes('text/html')) throw new Error('Not HTML');
        return res.text();
      })
      .catch(err => {
        pageCache.delete(key);
        throw err;
      });

    if (pageCache.size >= MAX_CACHE) {
      const oldestKey = pageCache.keys().next().value;
      pageCache.delete(oldestKey);
    }
    pageCache.set(key, { time: now, promise });
    return promise;
  }

  function executeContentScripts(container) {
    container.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      for (const attr of oldScript.attributes) {
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  }

  async function navigateInstant(urlObj, { push = true, restoreScrollY = null } = {}) {
    const navId = ++inflightNavId;

    // Save scroll position on current history entry before leaving
    if (push) {
      try {
        history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', location.href);
      } catch (e) {}
    }

    // Optimistically glide the Sakuga tab indicator on 0ms!
    syncMenuActive(urlObj.pathname, false);

    // Close mobile menu drawer if open
    const siteNav = document.querySelector('.site-nav.site-nav-on');
    const navToggleBtn = document.querySelector('.site-nav-toggle button');
    if (siteNav && window.$) {
      window.$(siteNav).stop().slideUp('fast', () => siteNav.classList.remove('site-nav-on'));
      if (navToggleBtn) navToggleBtn.setAttribute('aria-expanded', 'false');
    }

    // Show top stream loading indicator if fetch takes more than 40ms (slow network or cold fetch)
    const headband = document.querySelector('.headband');
    let loadingTimer = 0;
    let loadingProgress = 0.18;
    let progressTimer = 0;

    const startLoadingFeedback = () => {
      if (!headband) return;
      headband.classList.add('is-nav-loading');
      headband.style.transform = 'scaleX(0.18)';
      progressTimer = window.setInterval(() => {
        if (loadingProgress < 0.85) {
          loadingProgress += (0.88 - loadingProgress) * 0.14;
          headband.style.transform = `scaleX(${loadingProgress.toFixed(3)})`;
        }
      }, 90);
    };

    loadingTimer = window.setTimeout(startLoadingFeedback, 40);

    let html;
    try {
      html = await fetchPageHtml(urlObj);
    } catch (e) {
      clearTimeout(loadingTimer);
      clearInterval(progressTimer);
      if (headband) {
        headband.classList.remove('is-nav-loading');
      }
      if (navigator.onLine === false) {
        showNeoToast('📡 当前网络已断开，请检查网络后重试', true);
        return;
      }
      location.href = urlObj.href;
      return;
    }

    clearTimeout(loadingTimer);
    clearInterval(progressTimer);
    if (headband) {
      headband.style.transform = 'scaleX(1)';
      window.setTimeout(() => {
        headband.classList.remove('is-nav-loading');
      }, 160);
    }

    if (navId !== inflightNavId) return;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const nextContent = doc.querySelector('#content');
    const curContent = document.querySelector('#content');
    if (!nextContent || !curContent) {
      location.href = urlObj.href;
      return;
    }

    // 1. Update Title & Container Page Class
    if (doc.title) document.title = doc.title;
    const nextContainer = doc.querySelector('.container');
    const curContainer = document.querySelector('.container');
    if (nextContainer && curContainer) {
      curContainer.className = nextContainer.className;
    }

    // 2. Swap Main Content & Sidebar Inner (preserving open/closed sidebar state)
    curContent.innerHTML = nextContent.innerHTML;
    executeContentScripts(curContent);

    const nextSidebarInner = doc.querySelector('.sidebar-inner');
    const curSidebarInner = document.querySelector('.sidebar-inner');
    if (nextSidebarInner && curSidebarInner) {
      curSidebarInner.innerHTML = nextSidebarInner.innerHTML;
      if (
        document.documentElement.classList.contains('sidebar-preopen') ||
        document.querySelector('.sidebar.sidebar-active')
      ) {
        curSidebarInner.querySelectorAll('.motion-element').forEach(el => {
          el.style.opacity = '1';
        });
      }
    }

    // 3. Push History & Update Scroll Position
    if (push) {
      try {
        history.pushState({ sakugaInstant: true, scrollY: 0 }, '', urlObj.href);
      } catch (e) {}
    }

    if (typeof restoreScrollY === 'number') {
      window.scrollTo(0, restoreScrollY);
    } else if (urlObj.hash) {
      const hashEl = document.getElementById(decodeURIComponent(urlObj.hash.slice(1)));
      if (hashEl) hashEl.scrollIntoView();
      else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }

    // 4. Re-sync Nav & Re-hydrate NexT + GSAP Motion
    syncMenuActive(location.pathname, false);

    if (window.NexT && window.NexT.utils) {
      window.NexT.utils.lazyLoadPostsImages && window.NexT.utils.lazyLoadPostsImages();
      if (window.CONFIG && window.CONFIG.fancybox && window.NexT.utils.wrapImageWithFancyBox) {
        window.NexT.utils.wrapImageWithFancyBox();
      }
      if (window.CONFIG && window.CONFIG.tabs && window.NexT.utils.registerTabsTag) {
        window.NexT.utils.registerTabsTag();
      }
      window.NexT.utils.embeddedVideoTransformer && window.NexT.utils.embeddedVideoTransformer();
      window.NexT.utils.refreshSidebarDimension && window.NexT.utils.refreshSidebarDimension();
    }

    if (typeof window.NexTInitPostDetails === 'function') {
      window.NexTInitPostDetails();
    }
    if (typeof window.initSakugaMotion === 'function') {
      window.initSakugaMotion({ isInstantNav: true });
    }
  }

  // Seed current page into cache after idle so clicking "Back" or returning to initial page is 0ms
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      try {
        const selfUrl = new URL(location.href);
        pageCache.set(cacheKey(selfUrl), {
          time: Date.now(),
          promise: Promise.resolve(document.documentElement.outerHTML)
        });
      } catch (e) {}
    });
  }

  // Prefetch on hover (35ms intent debounce) & pointerdown
  document.addEventListener(
    'pointerover',
    e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (isDataSaver()) return;
      const anchor = e.target.closest && e.target.closest('a[href]');
      const url = parseEligibleUrl(anchor, null);
      if (!url) return;
      clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => {
        fetchPageHtml(url).catch(() => {});
      }, 35);
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerdown',
    e => {
      if (e.button !== 0) return;
      const anchor = e.target.closest && e.target.closest('a[href]');
      const url = parseEligibleUrl(anchor, null);
      if (url) fetchPageHtml(url).catch(() => {});
    },
    { passive: true }
  );

  // Intercept eligible internal link clicks
  document.addEventListener('click', e => {
    const anchor = e.target.closest && e.target.closest('a[href]');
    const url = parseEligibleUrl(anchor, e);
    if (!url) return;

    // Clicking a link to the exact current URL (no hash): smooth scroll to top instead of reloading
    if (url.pathname === location.pathname && url.search === location.search && !url.hash) {
      e.preventDefault();
      syncMenuActive(url.pathname, false);
      if (window.scrollY > 4) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    e.preventDefault();
    navigateInstant(url, { push: true });
  });

  // Instant Browser Back / Forward
  window.addEventListener('popstate', e => {
    const url = new URL(location.href);
    const savedY = e.state && typeof e.state.scrollY === 'number' ? e.state.scrollY : 0;
    navigateInstant(url, { push: false, restoreScrollY: savedY });
  });
})();

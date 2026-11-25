/**
 * Neo-Brutalist × Sakuga GSAP 3 Motion Choreography
 * Zero-FOUC, pure GPU-composited transforms (no boxShadow paint storms),
 * re-entrant for instant client-side navigation.
 */
(() => {
  const reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let chromeInitialized = false;
  let updateScrollBounds = null;

  function bindCardLift(el, x = -2.5, y = -3, duration = 0.16) {
    if (!el || el.dataset.cardHoverBound === '1') return;
    el.dataset.cardHoverBound = '1';
    const gsap = window.gsap;
    if (!gsap) return;

    el.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      gsap.to(el, { x, y, duration, ease: 'power2.out', force3D: true, overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration, ease: 'power2.out', force3D: true, overwrite: 'auto' });
    });
  }

  function bindTactileButton(el) {
    if (!el || el.dataset.tactileBound === '1') return;
    el.dataset.tactileBound = '1';
    const gsap = window.gsap;
    if (!gsap) return;

    const resetBtn = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.14,
        ease: 'power2.out',
        force3D: true,
        overwrite: 'auto'
      });
    };

    el.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      gsap.to(el, { x: -1.5, y: -1.5, duration: 0.14, ease: 'power2.out', force3D: true, overwrite: 'auto' });
    });
    el.addEventListener('pointerleave', resetBtn);
    el.addEventListener('pointercancel', resetBtn);

    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      gsap.to(el, {
        x: 2,
        y: 2,
        scaleX: 1.02,
        scaleY: 0.96,
        duration: 0.05,
        ease: 'power1.out',
        force3D: true,
        overwrite: 'auto'
      });
    });

    el.addEventListener('pointerup', () => {
      gsap.to(el, {
        x: -1.5,
        y: -1.5,
        scaleX: 1,
        scaleY: 1,
        duration: 0.18,
        ease: 'back.out(2)',
        force3D: true,
        overwrite: 'auto'
      });
    });
  }

  function initStaticChrome(gsap, fx, isColdSession) {
    if (chromeInitialized) return;
    chromeInitialized = true;

    // 1. Top Scroll Progress Ribbon (.headband)
    const headband = document.querySelector('.headband');
    if (headband) {
      const setScaleX = gsap.quickSetter(headband, 'scaleX');
      let maxScroll = 0;
      let scrollTicking = false;

      const renderProgress = () => {
        scrollTicking = false;
        const ratio = maxScroll > 20 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
        setScaleX(ratio);
      };

      updateScrollBounds = () => {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        renderProgress();
      };

      updateScrollBounds();
      window.addEventListener(
        'scroll',
        () => {
          if (!scrollTicking) {
            scrollTicking = true;
            window.requestAnimationFrame(renderProgress);
          }
        },
        { passive: true }
      );
      window.addEventListener('resize', updateScrollBounds, { passive: true });
      window.addEventListener('load', updateScrollBounds, { once: true });
    }

    // 2. Brand Badge Stamp + Sparkle Hover
    const brand = document.querySelector('.site-meta .brand');
    const subtitle = document.querySelector('.site-subtitle');
    if (brand) {
      if (isColdSession) {
        gsap.fromTo(
          brand,
          { y: -10, scale: 0.9, rotation: -2.5, opacity: 0 },
          { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.42, ease: 'back.out(2)', clearProps: 'transform,opacity' }
        );
      }

      brand.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return;
        gsap.to(brand, {
          x: -2,
          y: -2,
          rotation: -2,
          scale: 1.04,
          duration: 0.16,
          ease: 'back.out(2.2)',
          force3D: true,
          overwrite: 'auto'
        });
        if (fx && !fx.calm) {
          const p = fx.at(brand, 0.92, 0.12);
          fx.kira(p.x, p.y, { r: 8, life: 0.42, col: '#ffe254' });
        }
      });

      brand.addEventListener('pointerleave', () => {
        gsap.to(brand, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.16,
          ease: 'power2.out',
          force3D: true,
          overwrite: 'auto'
        });
      });
    }

    if (isColdSession && subtitle && subtitle.textContent.trim()) {
      gsap.fromTo(
        subtitle,
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.32, delay: 0.08, ease: 'power2.out', clearProps: 'transform,opacity' }
      );
    }

    // 3. Persistent Floating Dock Controls
    document.querySelectorAll('.sidebar-toggle').forEach(bindTactileButton);

    const b2t = document.querySelector('.back-to-top');
    if (b2t) {
      bindTactileButton(b2t);
      b2t.addEventListener(
        'click',
        e => {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (fx && !fx.calm) {
            const p = fx.at(b2t, 0.5, 0.9);
            fx.puff(p.x, p.y + 4, { size: 8, n: 4, vy: 14, life: 0.45 });
          }
          const scrollProxy = { y: window.scrollY };
          gsap.to(scrollProxy, {
            y: 0,
            duration: 0.44,
            ease: 'power3.out',
            onUpdate: () => window.scrollTo(0, scrollProxy.y)
          });
        },
        true
      );
    }
  }

  function initSakugaMotion(opts = {}) {
    if (reducedMotion || !window.gsap) return;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.getAll().forEach(st => st.kill());
    }

    const fx = window.SakugaFX;
    const isInstantNav = Boolean(opts.isInstantNav);
    let isColdSession = !isInstantNav;
    if (isColdSession) {
      try {
        if (sessionStorage.getItem('tpc-chrome-booted') === '1') {
          isColdSession = false;
        } else {
          sessionStorage.setItem('tpc-chrome-booted', '1');
        }
      } catch (e) {}
    }

    initStaticChrome(gsap, fx, isColdSession);

    // 1. Viewport-Smart Post Cards Entrance + Feed Hover Lift
    const postBlocks = gsap.utils.toArray('.posts-expand .post-block');
    if (postBlocks.length) {
      const vh = window.innerHeight || 900;
      const inView = [];
      const belowFold = [];

      postBlocks.forEach(block => {
        (block.getBoundingClientRect().top < vh * 0.94 ? inView : belowFold).push(block);
      });

      if (inView.length) {
        gsap.fromTo(
          inView,
          { y: isInstantNav ? 12 : 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: isInstantNav ? 0.22 : 0.38,
            stagger: isInstantNav ? 0.03 : 0.055,
            ease: 'power2.out',
            clearProps: 'transform,opacity'
          }
        );
      }

      if (belowFold.length && ScrollTrigger) {
        belowFold.forEach(card => {
          gsap.fromTo(
            card,
            { y: 24, opacity: 0 },
            {
              scrollTrigger: { trigger: card, start: 'top 92%', once: true },
              y: 0,
              opacity: 1,
              duration: 0.36,
              ease: 'power2.out',
              clearProps: 'transform,opacity'
            }
          );
        });
      }

      postBlocks.forEach(card => {
        if (!card.querySelector('.post-card-footer')) return;
        card.classList.add('is-feed-card');
        bindCardLift(card, -2.5, -3, 0.16);
      });
    }

    // 2. Secondary Pages: Tags, Categories, Archives
    const tagPills = gsap.utils.toArray('.tag-cloud-tags .tag-pill');
    if (tagPills.length) {
      gsap.fromTo(
        tagPills.slice(0, 36),
        { y: 12, scale: 0.92, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: isInstantNav ? 0.22 : 0.32,
          stagger: { amount: isInstantNav ? 0.14 : 0.22, from: 'start' },
          ease: 'back.out(1.6)',
          clearProps: 'transform,opacity'
        }
      );
    }

    const catCards = gsap.utils.toArray('.category-all .category-list-item');
    if (catCards.length) {
      gsap.fromTo(
        catCards,
        { y: 14, scale: 0.95, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: isInstantNav ? 0.22 : 0.34,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'transform,opacity'
        }
      );
      catCards.forEach(card => bindCardLift(card, -2.5, -2.5, 0.15));
    }

    const archiveBlock = document.querySelector('.post-block.archive, .post-block.tag, .post-block.category');
    if (archiveBlock) {
      gsap.fromTo(
        archiveBlock,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: isInstantNav ? 0.2 : 0.32, ease: 'power2.out', clearProps: 'transform,opacity' }
      );

      const timelineRows = gsap.utils
        .toArray('.posts-collapse .collection-title, .posts-collapse .post')
        .slice(0, 14);
      if (timelineRows.length) {
        gsap.fromTo(
          timelineRows,
          { x: -10, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.24, stagger: 0.02, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
      }
    }

    // 3. Resume Cards, Tactile Buttons & Sticker Pills
    gsap.utils.toArray('.resume-work-card').forEach(card => bindCardLift(card, -3, -3, 0.16));

    document
      .querySelectorAll(
        '.post-button a.btn, .links-of-author-item a, .pagination a.page-number, .pagination a.prev, .pagination a.next, .post-nav-item a'
      )
      .forEach(bindTactileButton);

    document.querySelectorAll('.post-category a, .post-tags a, .tag-pill').forEach(pill => {
      if (pill.dataset.wiggleBound === '1') return;
      pill.dataset.wiggleBound = '1';
      pill.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return;
        const angle = (Math.random() > 0.5 ? 1 : -1) * 2.5;
        gsap.to(pill, { y: -1.5, rotation: angle, scale: 1.04, duration: 0.14, ease: 'power2.out', force3D: true, overwrite: 'auto' });
      });
      pill.addEventListener('pointerleave', () => {
        gsap.to(pill, { y: 0, rotation: 0, scale: 1, duration: 0.14, ease: 'power2.out', force3D: true, overwrite: 'auto' });
      });
    });

    // 4. Sidebar Stat Counters (initial cold boot only)
    if (isColdSession) {
      document.querySelectorAll('.site-state-item-count').forEach(counter => {
        const targetVal = parseInt(counter.textContent.trim(), 10);
        if (!Number.isFinite(targetVal) || targetVal <= 0) return;
        const state = { val: 0 };
        gsap.to(state, {
          val: targetVal,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => {
            counter.textContent = String(Math.round(state.val));
          }
        });
      });
    }

    if (updateScrollBounds) {
      window.requestAnimationFrame(updateScrollBounds);
    }
    if (ScrollTrigger) {
      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    }
  }

  window.initSakugaMotion = initSakugaMotion;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initSakugaMotion({ isInstantNav: false }));
  } else {
    initSakugaMotion({ isInstantNav: false });
  }
})();

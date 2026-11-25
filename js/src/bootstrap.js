/* global NexT: true */

$(document).ready(function () {
  $(document).trigger('bootstrap:before');

  NexT.utils.isMobile() && window.FastClick && window.FastClick.attach(document.body);
  NexT.utils.lazyLoadPostsImages();
  NexT.utils.registerESCKeyEvent();
  NexT.utils.registerBackToTop();

  // Mobile top menu drawer
  $('.site-nav-toggle button').on('click', function () {
    var $siteNav = $('.site-nav');
    var ON_CLASS = 'site-nav-on';
    var isOpen = $siteNav.hasClass(ON_CLASS);

    $(this).attr('aria-expanded', String(!isOpen));
    $siteNav.stop()[isOpen ? 'slideUp' : 'slideDown']('fast', function () {
      $siteNav[isOpen ? 'removeClass' : 'addClass'](ON_CLASS);
    });
  });

  CONFIG.fancybox && NexT.utils.wrapImageWithFancyBox();
  CONFIG.tabs && NexT.utils.registerTabsTag();
  NexT.utils.embeddedVideoTransformer();
  NexT.utils.addActiveClassToMenuItem();

  if (CONFIG.sidebar.display === 'always' && !$('.post-toc-content').length) {
    // Pages with a TOC open their sidebar in post-details.js.
    NexT.utils.displaySidebar();
  }

  $(document).trigger('bootstrap:after');

  // Lightweight click confetti (throttled & skipped on data-saver / 2G)
  var lastConfettiAt = 0;
  var CONFETTI_SKIP_SELECTOR =
    'a, button, input, textarea, select, summary, .sidebar-toggle, .back-to-top, .sidebar-nav, pre, code';

  function boomConfetti(e) {
    if (typeof window.confetti !== 'function') return;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || (conn.effectiveType && conn.effectiveType.includes('2g')))) return;
    if (e.target && e.target.closest && e.target.closest(CONFETTI_SKIP_SELECTOR)) return;
    if (window.getSelection && String(window.getSelection()).length > 0) return;

    var now = performance.now();
    if (now - lastConfettiAt < 260) return;
    lastConfettiAt = now;

    window.confetti({
      particleCount: 16,
      startVelocity: 18,
      spread: 360,
      ticks: 40,
      scalar: 0.85,
      zIndex: 900,
      disableForReducedMotion: true,
      origin: {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      }
    });
  }

  if (!window.__confetti_click_bound__) {
    document.addEventListener('click', boomConfetti);
    window.__confetti_click_bound__ = true;
  }
});

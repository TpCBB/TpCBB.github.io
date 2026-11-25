/* global NexT: true */

$(document).ready(function () {

  $(document).trigger('bootstrap:before');

  NexT.utils.isMobile() && window.FastClick && window.FastClick.attach(document.body);

  NexT.utils.lazyLoadPostsImages();

  NexT.utils.registerESCKeyEvent();

  NexT.utils.registerBackToTop();

  // Mobile top menu bar.
  $('.site-nav-toggle button').on('click', function () {
    var $siteNav = $('.site-nav');
    var ON_CLASS_NAME = 'site-nav-on';
    var isSiteNavOn = $siteNav.hasClass(ON_CLASS_NAME);
    var animateAction = isSiteNavOn ? 'slideUp' : 'slideDown';
    var animateCallback = isSiteNavOn ? 'removeClass' : 'addClass';

    $(this).attr('aria-expanded', String(!isSiteNavOn));
    $siteNav.stop()[animateAction]('fast', function () {
      $siteNav[animateCallback](ON_CLASS_NAME);
    });
  });

  /**
   * Register JS handlers by condition option.
   * Need to add config option in Front-End at 'layout/_partials/head.swig' file.
   */
  CONFIG.fancybox && NexT.utils.wrapImageWithFancyBox();
  CONFIG.tabs && NexT.utils.registerTabsTag();

  NexT.utils.embeddedVideoTransformer();
  NexT.utils.addActiveClassToMenuItem();


  // Define Motion Sequence.
  NexT.motion.integrator
    .add(NexT.motion.middleWares.logo)
    .add(NexT.motion.middleWares.menu)
    .add(NexT.motion.middleWares.postList)
    .add(NexT.motion.middleWares.sidebar);

  $(document).trigger('motion:before');

  // Bootstrap Motion.
  if (CONFIG.motion.enable) {
    NexT.motion.integrator.bootstrap();
  } else if (CONFIG.sidebar.display === 'always' && !$('.post-toc-content').length) {
    // Pages with a table of contents open their sidebar in post-details.js.
    NexT.utils.displaySidebar();
  }

  $(document).trigger('bootstrap:after');


  let lastConfettiAt = 0;
  const boomConfetti = (clickEvent) => {
    if (typeof window.confetti !== 'function') return;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || (conn.effectiveType && conn.effectiveType.includes('2g')))) return;
    const target = clickEvent.target;
    if (
      target &&
      target.closest &&
      target.closest('a, button, input, textarea, select, summary, .sidebar-toggle, .back-to-top, .sidebar-nav, pre, code')
    ) {
      return;
    }
    if (window.getSelection && String(window.getSelection()).length > 0) return;
    const now = performance.now();
    if (now - lastConfettiAt < 260) return;
    lastConfettiAt = now;
    const { clientX, clientY } = clickEvent;
    const { innerWidth, innerHeight } = window;
    const y = clientY / innerHeight;
    const x = clientX / innerWidth;
    window.confetti({
      particleCount: 16,
      startVelocity: 18,
      spread: 360,
      ticks: 40,
      scalar: 0.85,
      zIndex: 900,
      disableForReducedMotion: true,
      origin: { y, x },
    });
  };

  const key = "__confetti_click_bound__";
  if (!(window)[key]) {
    document.addEventListener("click", boomConfetti);
    (window)[key] = true;
  }


});

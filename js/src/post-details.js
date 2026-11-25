/* global NexT: true */

(function () {
  function initPostDetails() {
    var tocSelector = '.post-toc';
    var $tocElement = $(tocSelector);
    var activeCurrentSelector = '.active-current';

    // Clean up previous scrollspy listener before re-binding on instant navigation
    $(window).off('scroll.bs.scrollspy');
    $('body').removeData('bs.scrollspy');

    if ($tocElement.length && $tocElement.find('.nav li > a').length) {
      $tocElement
        .off('activate.bs.scrollspy clear.bs.scrollspy')
        .on('activate.bs.scrollspy', function () {
          var $currentActiveElement = $(tocSelector + ' .active').last();
          if (!$currentActiveElement.length) return;

          removeCurrentActiveClass();
          $currentActiveElement.addClass('active-current');

          var targetScroll =
            $currentActiveElement.offset().top -
            $tocElement.offset().top +
            $tocElement.scrollTop() -
            $tocElement.height() / 2;
          $tocElement.scrollTop(targetScroll);
        })
        .on('clear.bs.scrollspy', removeCurrentActiveClass);

      $('body').scrollspy({ target: tocSelector });
    }

    function removeCurrentActiveClass() {
      $(tocSelector + ' ' + activeCurrentSelector).removeClass(activeCurrentSelector.substring(1));
    }

    $('.sidebar-nav li')
      .off('click.nextPostDetails')
      .on('click.nextPostDetails', function () {
        var item = $(this);
        var activeTabClassName = 'sidebar-nav-active';
        var activePanelClassName = 'sidebar-panel-active';
        if (item.hasClass(activeTabClassName)) {
          return;
        }

        var currentTarget = $('.' + activePanelClassName);
        var target = $('.' + item.data('target'));

        if (window.gsap && target[0]) {
          var g = window.gsap;
          g.killTweensOf([currentTarget[0], target[0]]);
          currentTarget.removeClass(activePanelClassName).css({ display: 'none', opacity: '' });
          target.addClass(activePanelClassName).css({ display: 'block' });
          g.fromTo(
            target[0],
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.2, ease: 'power2.out', clearProps: 'transform,opacity' }
          );
        } else {
          currentTarget.removeClass(activePanelClassName).hide();
          target.addClass(activePanelClassName).show();
        }

        item.siblings().removeClass(activeTabClassName);
        item.addClass(activeTabClassName);
      });

    // TOC item smooth scroll without URL hash jump
    $('.post-toc a')
      .off('click.nextPostDetails')
      .on('click.nextPostDetails', function (e) {
        e.preventDefault();
        var targetSelector = NexT.utils.escapeSelector(this.getAttribute('href'));
        var $target = $(targetSelector);
        if (!$target.length) return;
        var offset = $target.offset().top;

        if (window.gsap) {
          var scrollProxy = { y: window.scrollY };
          window.gsap.to(scrollProxy, {
            y: offset,
            duration: 0.36,
            ease: 'power3.out',
            onUpdate: function () {
              window.scrollTo(0, scrollProxy.y);
            }
          });
        } else {
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      });

    // Expand sidebar on post detail page by default when post has a TOC
    var $tocContent = $('.post-toc-content');
    var isSidebarCouldDisplay = CONFIG.sidebar.display === 'post' || CONFIG.sidebar.display === 'always';
    var hasTOC = $tocContent.length > 0 && $tocContent.html().trim().length > 0;
    if (isSidebarCouldDisplay && hasTOC) {
      CONFIG.motion.enable
        ? (NexT.motion.middleWares.sidebar = function () {
            NexT.utils.displaySidebar();
          })
        : NexT.utils.displaySidebar();
    }
  }

  window.NexTInitPostDetails = initPostDetails;

  $(document).ready(function () {
    initPostDetails();
  });
})();

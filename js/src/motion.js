/* global NexT: true */

$(document).ready(function () {
  NexT.motion = {};

  var SIDEBAR_WIDTH = 320;
  var xPos, yPos;

  var line1 = document.querySelector('.sidebar-toggle-line-first');
  var line2 = document.querySelector('.sidebar-toggle-line-middle');
  var line3 = document.querySelector('.sidebar-toggle-line-last');

  function morphToggleIcon(state, immediate) {
    var g = window.gsap;
    if (!g || !line1 || !line2 || !line3) return;
    var dur = immediate ? 0 : 0.3;
    if (state === 'close') {
      g.to(line1, { x: 0, y: 5, rotation: -45, width: '100%', transformOrigin: '50% 50%', duration: dur, ease: 'back.out(2)', overwrite: 'auto' });
      g.to(line2, { scaleX: 0, opacity: 0, transformOrigin: '50% 50%', duration: immediate ? 0 : 0.16, overwrite: 'auto' });
      g.to(line3, { x: 0, y: -5, rotation: 45, width: '100%', transformOrigin: '50% 50%', duration: dur, ease: 'back.out(2)', overwrite: 'auto' });
    } else if (state === 'arrow') {
      g.to(line1, { x: 0, y: 5, rotation: -38, width: '62%', transformOrigin: '0% 50%', duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
      g.to(line2, { scaleX: 1, opacity: 1, width: '100%', transformOrigin: '50% 50%', duration: 0.18, overwrite: 'auto' });
      g.to(line3, { x: 0, y: -5, rotation: 38, width: '62%', transformOrigin: '0% 50%', duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
    } else {
      g.to(line1, { x: 0, y: 0, rotation: 0, width: '100%', transformOrigin: '50% 50%', duration: dur, ease: 'back.out(1.8)', overwrite: 'auto' });
      g.to(line2, { scaleX: 1, opacity: 1, width: '100%', transformOrigin: '50% 50%', duration: immediate ? 0 : 0.2, overwrite: 'auto' });
      g.to(line3, { x: 0, y: 0, rotation: 0, width: '100%', transformOrigin: '50% 50%', duration: dur, ease: 'back.out(1.8)', overwrite: 'auto' });
    }
  }

  var sidebarToggleMotion = {
    toggleEl: $('.sidebar-toggle'),
    dimmerEl: $('#sidebar-dimmer'),
    sidebarEl: $('.sidebar'),
    isSidebarVisible: document.documentElement.classList.contains('sidebar-preopen'),
    init: function () {
      var sidebarNode = this.sidebarEl[0];
      var g = window.gsap;

      if (sidebarNode && g && window.innerWidth >= 992) {
        g.set(sidebarNode, {
          width: SIDEBAR_WIDTH,
          display: 'block',
          xPercent: this.isSidebarVisible ? 0 : 100
        });
        g.set(document.body, { paddingRight: this.isSidebarVisible ? SIDEBAR_WIDTH : 0 });
        this.sidebarEl.find('.motion-element').css({ opacity: 1 });
        if (this.isSidebarVisible) {
          this.sidebarEl.addClass('sidebar-active');
        }
        morphToggleIcon(this.isSidebarVisible ? 'close' : 'init', true);
        document.documentElement.classList.add('sidebar-gsap-ready');
      }

      this.toggleEl.on('click', this.clickHandler.bind(this));
      this.dimmerEl.on('click', this.clickHandler.bind(this));
      this.toggleEl.on('mouseenter', this.mouseEnterHandler.bind(this));
      this.toggleEl.on('mouseleave', this.mouseLeaveHandler.bind(this));
      this.sidebarEl.on('touchstart', this.touchstartHandler.bind(this));
      this.sidebarEl.on('touchend', this.touchendHandler.bind(this));

      var self = this;
      window.addEventListener('resize', function () {
        if (!sidebarNode || !window.gsap) return;
        if (window.innerWidth < 992) {
          window.gsap.set(document.body, { clearProps: 'paddingRight' });
          window.gsap.set(sidebarNode, { clearProps: 'width,display,transform' });
        } else {
          window.gsap.set(sidebarNode, { width: SIDEBAR_WIDTH, display: 'block', xPercent: self.isSidebarVisible ? 0 : 100 });
          window.gsap.set(document.body, { paddingRight: self.isSidebarVisible ? SIDEBAR_WIDTH : 0 });
        }
      }, { passive: true });
    },
    clickHandler: function () {
      var fx = window.SakugaFX;
      var btn = this.toggleEl[0];
      if (fx && !fx.calm && btn) {
        var p = fx.at(btn, 0.5, 0.5);
        fx.ticks(p.x, p.y, { dir: this.isSidebarVisible ? 0 : Math.PI, r: 22, len: 8, n: 3, life: 0.32 });
      }
      this.isSidebarVisible ? this.hideSidebar() : this.showSidebar();
      this.isSidebarVisible = !this.isSidebarVisible;
    },
    mouseEnterHandler: function () {
      if (this.isSidebarVisible) return;
      morphToggleIcon('arrow', false);
    },
    mouseLeaveHandler: function () {
      if (this.isSidebarVisible) return;
      morphToggleIcon('init', false);
    },
    touchstartHandler: function (e) {
      xPos = e.originalEvent.touches[0].clientX;
      yPos = e.originalEvent.touches[0].clientY;
    },
    touchendHandler: function (e) {
      var _xPos = e.originalEvent.changedTouches[0].clientX;
      var _yPos = e.originalEvent.changedTouches[0].clientY;
      if (_xPos - xPos > 30 && Math.abs(_yPos - yPos) < 20) {
        this.clickHandler();
      }
    },
    showSidebar: function () {
      var self = this;
      var g = window.gsap;
      var sidebarNode = this.sidebarEl[0];
      var contentWrap = document.querySelector('.content-wrap');
      var prevLeft = contentWrap ? contentWrap.getBoundingClientRect().left : 0;

      try {
        sessionStorage.removeItem('tpc-sidebar-closed');
      } catch (e) {}
      document.documentElement.classList.add('sidebar-preopen');

      morphToggleIcon('close', false);
      this.sidebarEl.addClass('sidebar-active');
      this.sidebarEl.trigger('sidebar.isShowing');

      if (g && sidebarNode) {
        g.set(sidebarNode, { width: SIDEBAR_WIDTH, display: 'block' });
        if (window.innerWidth >= 992) {
          g.set(document.body, { paddingRight: SIDEBAR_WIDTH });
          if (contentWrap) {
            var dx = prevLeft - contentWrap.getBoundingClientRect().left;
            if (Math.abs(dx) > 1) {
              g.fromTo(
                '.container .header-inner, .container .content-wrap, .container .footer-inner',
                { x: dx },
                { x: 0, duration: 0.3, ease: 'expo.out', overwrite: 'auto', clearProps: 'transform' }
              );
            }
          }
        }
        g.to(sidebarNode, {
          xPercent: 0,
          duration: 0.3,
          ease: 'expo.out',
          overwrite: 'auto',
          onComplete: function () {
            self.sidebarEl.trigger('sidebar.didShow');
            self.sidebarEl.trigger('sidebar.motion.complete');
            if (window.ScrollTrigger) window.ScrollTrigger.refresh();
          }
        });

        var staggerItems = sidebarNode.querySelectorAll(
          '.sidebar-nav, .sidebar-panel-active .site-author-image, .sidebar-panel-active .site-author-name, .sidebar-panel-active .site-description, .sidebar-panel-active .site-state-item, .sidebar-panel-active .links-of-author-item'
        );
        if (staggerItems.length) {
          g.fromTo(
            staggerItems,
            { x: 14, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.24,
              stagger: 0.02,
              ease: 'power2.out',
              overwrite: 'auto',
              clearProps: 'transform,opacity'
            }
          );
        }
      }
    },
    hideSidebar: function () {
      var self = this;
      var g = window.gsap;
      var sidebarNode = this.sidebarEl[0];
      var contentWrap = document.querySelector('.content-wrap');
      var prevLeft = contentWrap ? contentWrap.getBoundingClientRect().left : 0;

      try {
        sessionStorage.setItem('tpc-sidebar-closed', '1');
      } catch (e) {}
      document.documentElement.classList.remove('sidebar-preopen');

      morphToggleIcon('init', false);
      this.sidebarEl.removeClass('sidebar-active');
      this.sidebarEl.trigger('sidebar.isHiding');

      if (g && sidebarNode) {
        if (window.innerWidth >= 992) {
          g.set(document.body, { paddingRight: 0 });
          if (contentWrap) {
            var dx = prevLeft - contentWrap.getBoundingClientRect().left;
            if (Math.abs(dx) > 1) {
              g.fromTo(
                '.container .header-inner, .container .content-wrap, .container .footer-inner',
                { x: dx },
                { x: 0, duration: 0.28, ease: 'power3.out', overwrite: 'auto', clearProps: 'transform' }
              );
            }
          }
        }
        g.to(sidebarNode, {
          xPercent: 100,
          duration: 0.28,
          ease: 'power3.out',
          overwrite: 'auto',
          onComplete: function () {
            if (window.ScrollTrigger) window.ScrollTrigger.refresh();
          }
        });
      }
    }
  };
  sidebarToggleMotion.init();

  NexT.motion.integrator = {
    queue: [],
    cursor: -1,
    add: function (fn) {
      this.queue.push(fn);
      return this;
    },
    next: function () {
      this.cursor++;
      var fn = this.queue[this.cursor];
      $.isFunction(fn) && fn(NexT.motion.integrator);
    },
    bootstrap: function () {
      this.next();
    }
  };

  NexT.motion.middleWares =  {
    logo: function (integrator) {
      var sequence = [];
      var $brand = $('.brand');
      var $title = $('.site-title');
      var $subtitle = $('.site-subtitle');
      var $logoLineTop = $('.logo-line-before i');
      var $logoLineBottom = $('.logo-line-after i');

      $brand.size() > 0 && sequence.push({
        e: $brand,
        p: {opacity: 1},
        o: {duration: 200}
      });

      NexT.utils.isMist() && hasElement([$logoLineTop, $logoLineBottom]) &&
      sequence.push(
        getMistLineSettings($logoLineTop, '100%'),
        getMistLineSettings($logoLineBottom, '-100%')
      );

      hasElement($title) && sequence.push({
        e: $title,
        p: {opacity: 1, top: 0},
        o: { duration: 200 }
      });

      hasElement($subtitle) && sequence.push({
        e: $subtitle,
        p: {opacity: 1, top: 0},
        o: {duration: 200}
      });

      if (CONFIG.motion.async) {
        integrator.next();
      }

      if (sequence.length > 0) {
        sequence[sequence.length - 1].o.complete = function () {
          integrator.next();
        };
        $.Velocity.RunSequence(sequence);
      } else {
        integrator.next();
      }


      function getMistLineSettings (element, translateX) {
        return {
          e: $(element),
          p: {translateX: translateX},
          o: {
            duration: 500,
            sequenceQueue: false
          }
        };
      }

      /**
       * Check if $elements exist.
       * @param {jQuery|Array} $elements
       * @returns {boolean}
       */
      function hasElement ($elements) {
        $elements = Array.isArray($elements) ? $elements : [$elements];
        return $elements.every(function ($element) {
          return $.isFunction($element.size) && $element.size() > 0;
        });
      }
    },

    menu: function (integrator) {

      if (CONFIG.motion.async) {
        integrator.next();
      }

      $('.menu-item').velocity('transition.slideDownIn', {
        display: null,
        duration: 200,
        complete: function () {
          integrator.next();
        }
      });
    },

    postList: function (integrator) {
      //var $post = $('.post');
      var $postBlock = $('.post-block, .pagination, .comments');
      var $postBlockTransition = CONFIG.motion.transition.post_block;
      var $postHeader = $('.post-header');
      var $postHeaderTransition = CONFIG.motion.transition.post_header;
      var $postBody = $('.post-body');
      var $postBodyTransition = CONFIG.motion.transition.post_body;
      var $collHeader = $('.collection-title, .archive-year');
      var $collHeaderTransition = CONFIG.motion.transition.coll_header;
      var $sidebarAffix = $('.sidebar-inner');
      var $sidebarAffixTransition = CONFIG.motion.transition.sidebar;
      var hasPost = $postBlock.size() > 0;

      hasPost ? postMotion() : integrator.next();

      if (CONFIG.motion.async) {
        integrator.next();
      }

      function postMotion () {
        var postMotionOptions = window.postMotionOptions || {
            stagger: 100,
            drag: true
          };
        postMotionOptions.complete = function () {
          // After motion complete need to remove transform from sidebar to let affix work on Pisces | Gemini.
          if (CONFIG.motion.transition.sidebar && (NexT.utils.isPisces() || NexT.utils.isGemini())) {
            $sidebarAffix.css({ 'transform': 'initial' });
          }
          integrator.next();
        };

        //$post.velocity('transition.slideDownIn', postMotionOptions);
        if (CONFIG.motion.transition.post_block) {
          $postBlock.velocity('transition.' + $postBlockTransition, postMotionOptions);
        }
        if (CONFIG.motion.transition.post_header) {
          $postHeader.velocity('transition.' + $postHeaderTransition, postMotionOptions);
        }
        if (CONFIG.motion.transition.post_body) {
          $postBody.velocity('transition.' + $postBodyTransition, postMotionOptions);
        }
        if (CONFIG.motion.transition.coll_header) {
          $collHeader.velocity('transition.' + $collHeaderTransition, postMotionOptions);
        }
        // Only for Pisces | Gemini.
        if (CONFIG.motion.transition.sidebar && (NexT.utils.isPisces() || NexT.utils.isGemini())) {
          $sidebarAffix.velocity('transition.' + $sidebarAffixTransition, postMotionOptions);
        }
      }
    },

    sidebar: function (integrator) {
      if (CONFIG.sidebar.display === 'always') {
        NexT.utils.displaySidebar();
      }
      integrator.next();
    }
  };

});

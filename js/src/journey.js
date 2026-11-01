(function () {
  'use strict';
  if (window.journey3dStarted) return;
  var canvas = document.getElementById('journey-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var width = 0, height = 0, frame = 0;
  var state = { progress: 0 }, scrollAnimation = null;
  var tau = Math.PI * 2;
  function resize() {
    var box = canvas.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); requestDraw();
  }
  function requestDraw() { if (!frame) frame = requestAnimationFrame(draw); }
  function draw() {
    frame = 0;
    ctx.clearRect(0, 0, width, height);
    var mobile = width < 768;
    var radius = mobile ? 40 : Math.min(65, width * .055);
    var length = Math.min(mobile ? 240 : 310, height * .58);
    var progress = Math.max(0, Math.min(1, state.progress));
    var cx = Math.max(width / 6, radius + length * .17 + 10);
    var cy = Math.min(Math.max(length / 2 + 120, height / 6), height / 2);
    var pitch = length * .85, angleOffset = progress * tau;
    // A quiet orbital ring ties the shape to the surrounding page.
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(-.36);
    ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.58, length * .28, .9, 0, tau);
    ctx.strokeStyle = '#83bfc2'; ctx.globalAlpha = .23; ctx.lineWidth = 1; ctx.stroke();
    var dotAngle = progress * tau * 1.5 - .7;
    var dotX = Math.cos(dotAngle) * radius * 1.58;
    var dotY = Math.sin(dotAngle) * length * .28;
    var rot = .9;
    ctx.beginPath(); ctx.arc(dotX * Math.cos(rot) - dotY * Math.sin(rot), dotX * Math.sin(rot) + dotY * Math.cos(rot), 3.5, 0, tau);
    ctx.fillStyle = '#e9b844'; ctx.globalAlpha = .65; ctx.fill();
    ctx.restore();
    var primitives = [];
    // Tilt the helix in three dimensions, then project it onto the background.
    // The smaller scroll-driven angle turns the helix around its own axis.
    function point(y, side) {
      var angle = y * tau / pitch + angleOffset;
      var x = Math.sin(angle) * radius * side;
      var z = Math.cos(angle) * radius * side;
      var tiltX = .22, tiltZ = -.36;
      var tiltedY = y * Math.cos(tiltX) - z * Math.sin(tiltX);
      var tiltedZ = y * Math.sin(tiltX) + z * Math.cos(tiltX);
      return {
        x: cx + x * Math.cos(tiltZ) - tiltedY * Math.sin(tiltZ),
        y: cy + x * Math.sin(tiltZ) + tiltedY * Math.cos(tiltZ),
        z: Math.max(-1, Math.min(1, tiltedZ / (radius + length * .20)))
      };
    }
    var count = 96;
    for (var side = -1; side <= 1; side += 2) {
      for (var i = 0; i < count; i++) {
        var a = point(-length / 2 + length * i / count, side);
        var b = point(-length / 2 + length * (i + 1) / count, side);
        primitives.push({a:a, b:b, z:(a.z+b.z)/2, rail:true});
      }
    }
    for (var j = 0; j <= 10; j++) {
      var py = -length / 2 + length * j / 10;
      var a = point(py, -1), b = point(py, 1);
      // Divide the rung so the end closer to the viewer can overlap the rear rail.
      for (var k = 0; k < 6; k++) {
        var t1 = k / 6, t2 = (k + 1) / 6;
        var p1 = {x:a.x+(b.x-a.x)*t1, y:a.y+(b.y-a.y)*t1, z:a.z+(b.z-a.z)*t1};
        var p2 = {x:a.x+(b.x-a.x)*t2, y:a.y+(b.y-a.y)*t2, z:a.z+(b.z-a.z)*t2};
        primitives.push({a:p1, b:p2, z:(p1.z+p2.z)/2, rail:false});
      }
    }
    primitives.sort(function (a, b) { return a.z - b.z; });
    // One continuous palette keeps the double helix visually cohesive.
    var gradient = ctx.createLinearGradient(cx - radius, cy - length * .55, cx + radius, cy + length * .55);
    gradient.addColorStop(0, '#e48387');
    gradient.addColorStop(.28, '#e7bc53');
    gradient.addColorStop(.58, '#64bfc0');
    gradient.addColorStop(.8, '#8ea6cb');
    gradient.addColorStop(1, '#e48387');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    primitives.forEach(function (piece) {
      var depth = (piece.z + 1) / 2;
      ctx.beginPath(); ctx.moveTo(piece.a.x, piece.a.y); ctx.lineTo(piece.b.x, piece.b.y);
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = piece.rail ? .25 + depth * .40 : .12 + depth * .20;
      ctx.lineWidth = piece.rail ? 3.5 + depth * 3.5 : 1.4 + depth * .9;
      ctx.stroke();
      if (piece.rail && depth > .55) {
        ctx.beginPath(); ctx.moveTo(piece.a.x - .6, piece.a.y - .6); ctx.lineTo(piece.b.x - .6, piece.b.y - .6);
        ctx.strokeStyle = '#fffdf7'; ctx.globalAlpha = .26 * depth; ctx.lineWidth = .8;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }
  function onScrollFallback() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.progress = reduced.matches ? 0 : Math.max(0, Math.min(1, window.scrollY / max));
    requestDraw();
  }
  function setupMotion() {
    if (scrollAnimation) {
      if (scrollAnimation.scrollTrigger) scrollAnimation.scrollTrigger.kill();
      scrollAnimation.kill(); scrollAnimation = null;
    }
    window.removeEventListener('scroll', onScrollFallback);
    state.progress = 0;
    if (!reduced.matches && window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      scrollAnimation = window.gsap.to(state, {
        progress: 1, ease: 'none', onUpdate: requestDraw,
        scrollTrigger: { trigger: document.documentElement, start: 0, end: 'max', scrub: 0.8, invalidateOnRefresh: true }
      });
    } else if (!reduced.matches) {
      window.addEventListener('scroll', onScrollFallback, {passive:true});
      onScrollFallback();
    }
    requestDraw();
  }
  window.addEventListener('resize', resize);
  if (reduced.addEventListener) reduced.addEventListener('change', setupMotion);
  resize();
  setupMotion();
}());

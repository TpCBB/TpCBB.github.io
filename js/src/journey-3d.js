(function () {
  'use strict';
  var canvas = document.getElementById('journey-canvas');
  if (!canvas || !window.THREE) return;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true, antialias: true, premultipliedAlpha: true});
  } catch (error) {
    // A canvas that attempted WebGL cannot reliably be reused for Canvas 2D.
    canvas.parentNode.replaceChild(canvas.cloneNode(false), canvas);
    return;
  }
  window.journey3dStarted = true;
  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 2000);
  camera.position.z = 1000;
  var group = new THREE.Group();
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, .82));
  var light = new THREE.DirectionalLight(0xffffff, .78);
  light.position.set(-4, 7, 10); scene.add(light);
  var fill = new THREE.DirectionalLight(0x9ed9d8, .32);
  fill.position.set(5, -4, -3); scene.add(fill);

  var palette = [0xf18b8e, 0xf3ca65, 0x79cfca, 0x9aafda, 0xe7a0b4].map(function (color) { return new THREE.Color(color); });
  var total = 5.4, radius = .92, turns = 1.38, steps = 150;
  function point(t, side) {
    var angle = t * Math.PI * 2 * turns;
    return new THREE.Vector3(Math.sin(angle) * radius * side, (t - .5) * total, Math.cos(angle) * radius * side);
  }
  function colorAt(t) {
    var v = Math.max(0, Math.min(.99999, t)) * (palette.length - 1);
    var index = Math.floor(v);
    return palette[index].clone().lerp(palette[index + 1], v - index);
  }
  var tubeMaterial = new THREE.MeshPhongMaterial({color:0xffffff, vertexColors:THREE.VertexColors, shininess:65, transparent:true, opacity:.67});
  for (var side = -1; side <= 1; side += 2) {
    var points = [];
    for (var i = 0; i <= steps; i++) points.push(point(i / steps, side));
    var curve = new THREE.CatmullRomCurve3(points);
    var tube = new THREE.TubeGeometry(curve, steps, .065, 9, false);
    tube.faces.forEach(function (face) {
      face.vertexColors = [face.a, face.b, face.c].map(function (index) {
        return colorAt((tube.vertices[index].y / total) + .5);
      });
    });
    group.add(new THREE.Mesh(tube, tubeMaterial));
  }
  // Small rods connect the strands while retaining true 3D depth and lighting.
  var rodGeometry = new THREE.CylinderGeometry(.025, .025, 1, 8, 1);
  var beadGeometry = new THREE.SphereGeometry(.06, 10, 8);
  var yAxis = new THREE.Vector3(0, 1, 0);
  for (var j = 0; j <= 16; j++) {
    var t = j / 16, a = point(t, -1), b = point(t, 1);
    var direction = new THREE.Vector3().subVectors(b, a);
    var material = new THREE.MeshPhongMaterial({color:colorAt(t), transparent:true, opacity:.46, shininess:55});
    var rod = new THREE.Mesh(rodGeometry, material);
    rod.position.copy(a).add(b).multiplyScalar(.5);
    rod.scale.y = direction.length();
    rod.quaternion.setFromUnitVectors(yAxis, direction.clone().normalize());
    group.add(rod);
    var beadA = new THREE.Mesh(beadGeometry, material), beadB = new THREE.Mesh(beadGeometry, material);
    beadA.position.copy(a); beadB.position.copy(b); group.add(beadA); group.add(beadB);
  }
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = {progress:0}, animation = null, frame = 0, width = 0, height = 0;
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.left = -width / 2; camera.right = width / 2;
    camera.top = height / 2; camera.bottom = -height / 2;
    camera.updateProjectionMatrix(); schedule();
  }
  function render() {
    frame = 0;
    var mobile = width < 768;
    var size = Math.min(mobile ? 330 : 460, height * .63);
    var scale = size / total;
    group.scale.set(scale, scale, scale);
    var p = Math.max(0, Math.min(1, state.progress));
    var extentX = Math.min(width * .4, size * .35);
    var x = Math.max(width / 6, extentX);
    var y = Math.min(Math.max(size * .51 + 92, height / 6), height / 2);
    group.position.set(x - width / 2, height / 2 - y, 0);
    // One full turn over the page, smoothly reversible with the scroll.
    group.rotation.set(.24, -.18 + p * Math.PI * 2, -.34);
    renderer.render(scene, camera);
  }
  function fallbackScroll() {
    state.progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)));
    schedule();
  }
  function setupMotion() {
    if (animation) { if (animation.scrollTrigger) animation.scrollTrigger.kill(); animation.kill(); animation = null; }
    window.removeEventListener('scroll', fallbackScroll);
    state.progress = 0;
    if (!reduced.matches && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      animation = gsap.to(state, {progress:1, ease:'none', onUpdate:schedule,
        scrollTrigger:{trigger:document.documentElement, start:0, end:'max', scrub:.8, invalidateOnRefresh:true}});
    } else if (!reduced.matches) {
      window.addEventListener('scroll', fallbackScroll, {passive:true}); fallbackScroll();
    }
    schedule();
  }
  window.addEventListener('resize', resize);
  if (reduced.addEventListener) reduced.addEventListener('change', setupMotion);
  resize(); setupMotion();
}());

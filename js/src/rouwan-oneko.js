// oneko.js (GPU-composited & idle-hibernating edition): https://github.com/adryd325/oneko.js

(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.saveData) return;

  if (isReducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const nekoEl = document.createElement("div");

  let nekoPosX = Math.max(24, window.innerWidth - 72);
  let nekoPosY = Math.max(24, window.innerHeight - 72);

  let mousePosX = nekoPosX;
  let mousePosY = nekoPosY;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  let rafId = 0;
  let idleTimerId = 0;
  let lastFrameTimestamp = 0;
  let lastMoveTimestamp = 0;

  const nekoSpeed = 400; // pixels per second
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0],
    ],
    scratchWallN: [
      [0, 0],
      [0, -1],
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2],
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3],
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1],
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1],
    ],
    N: [
      [-1, -2],
      [-1, -3],
    ],
    NE: [
      [0, -2],
      [0, -3],
    ],
    E: [
      [-3, 0],
      [-3, -1],
    ],
    SE: [
      [-5, -1],
      [-5, -2],
    ],
    S: [
      [-6, -3],
      [-7, -2],
    ],
    SW: [
      [-5, -3],
      [-6, -1],
    ],
    W: [
      [-4, -2],
      [-4, -3],
    ],
    NW: [
      [-1, 0],
      [-1, -1],
    ],
  };

  function applyTransform() {
    nekoEl.style.transform = `translate3d(${(nekoPosX - 16).toFixed(1)}px, ${(nekoPosY - 16).toFixed(1)}px, 0) scale(1.6)`;
  }

  function stopTimers() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (idleTimerId) {
      window.clearTimeout(idleTimerId);
      idleTimerId = 0;
    }
  }

  function wakeChase() {
    if (document.hidden || rafId) return;
    if (idleTimerId) {
      window.clearTimeout(idleTimerId);
      idleTimerId = 0;
    }
    lastMoveTimestamp = 0;
    rafId = window.requestAnimationFrame(onAnimationFrame);
  }

  function scheduleIdleTick() {
    if (document.hidden || rafId || idleTimerId) return;
    // Run at 10fps only during an active scratch/sleep sprite animation; drop to 1Hz while sitting still!
    const delay = idleAnimation ? 120 : 1000;
    idleTimerId = window.setTimeout(() => {
      idleTimerId = 0;
      if (!nekoEl.isConnected || document.hidden) return;
      const distance = Math.hypot(mousePosX - nekoPosX, mousePosY - nekoPosY);
      if (distance > 48.01) {
        wakeChase();
        return;
      }
      idle();
      scheduleIdleTick();
    }, delay);
  }

  function init() {
    let nekoFile = "./oneko.gif";
    const curScript = document.currentScript;
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat;
    }
    try {
      const saved = JSON.parse(window.sessionStorage.getItem("rouwan-position"));
      if (saved && [saved.x, saved.y, saved.mouseX, saved.mouseY].every(Number.isFinite)) {
        nekoPosX = Math.min(Math.max(16, saved.x), window.innerWidth - 16);
        nekoPosY = Math.min(Math.max(16, saved.y), window.innerHeight - 16);
        mousePosX = Math.min(Math.max(0, saved.mouseX), window.innerWidth);
        mousePosY = Math.min(Math.max(0, saved.mouseY), window.innerHeight);
        if (/^-?\d+px -?\d+px$/.test(saved.sprite || "")) {
          nekoEl.style.backgroundPosition = saved.sprite;
        }
      }
    } catch (error) {}
    if (!nekoEl.style.backgroundPosition) setSprite("idle", 0);

    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.left = "0";
    nekoEl.style.top = "0";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.zIndex = 999;
    nekoEl.style.transformOrigin = "50% 50%";
    nekoEl.style.filter = "drop-shadow(1px 1px 0 rgba(17,17,17,.12))";
    nekoEl.style.backgroundImage = `url(${nekoFile})`;
    applyTransform();

    document.body.appendChild(nekoEl);

    document.addEventListener(
      "mousemove",
      function (event) {
        mousePosX = event.clientX;
        mousePosY = event.clientY;
        if (!rafId && Math.hypot(mousePosX - nekoPosX, mousePosY - nekoPosY) > 48.01) {
          wakeChase();
        }
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopTimers();
      } else if (Math.hypot(mousePosX - nekoPosX, mousePosY - nekoPosY) > 48.01) {
        wakeChase();
      } else {
        scheduleIdleTick();
      }
    });

    window.addEventListener("pagehide", function () {
      try {
        window.sessionStorage.setItem(
          "rouwan-position",
          JSON.stringify({
            x: nekoPosX,
            y: nekoPosY,
            mouseX: mousePosX,
            mouseY: mousePosY,
            sprite: nekoEl.style.backgroundPosition,
          })
        );
      } catch (error) {}
    });

    if (Math.hypot(mousePosX - nekoPosX, mousePosY - nekoPosY) > 48.01) {
      wakeChase();
    } else {
      scheduleIdleTick();
    }
  }

  function onAnimationFrame(timestamp) {
    rafId = 0;
    if (!nekoEl.isConnected || document.hidden) return;
    const elapsed = lastMoveTimestamp ? Math.min((timestamp - lastMoveTimestamp) / 1000, 0.05) : 0.016;
    lastMoveTimestamp = timestamp;
    const dx = mousePosX - nekoPosX;
    const dy = mousePosY - nekoPosY;
    const distance = Math.hypot(dx, dy);

    if (distance <= 48.01) {
      idle();
      // Hibernate high-frequency rAF until mouse moves away again!
      scheduleIdleTick();
      return;
    }

    const step = Math.min(nekoSpeed * elapsed, distance - 48);
    nekoPosX = Math.min(Math.max(16, nekoPosX + (dx / distance) * step), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY + (dy / distance) * step), window.innerHeight - 16);
    applyTransform();

    if (!lastFrameTimestamp || timestamp - lastFrameTimestamp >= 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    rafId = window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frameIdx) {
    const sprite = spriteSets[name][frameIdx % spriteSets[name].length];
    const nextPos = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
    if (nekoEl.style.backgroundPosition !== nextPos) {
      nekoEl.style.backgroundPosition = nextPos;
    }
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (idleTime > 6 && Math.floor(Math.random() * 25) === 0 && idleAnimation == null) {
      const avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) avalibleIdleAnimations.push("scratchWallW");
      if (nekoPosY < 32) avalibleIdleAnimations.push("scratchWallN");
      if (nekoPosX > window.innerWidth - 32) avalibleIdleAnimations.push("scratchWallE");
      if (nekoPosY > window.innerHeight - 32) avalibleIdleAnimations.push("scratchWallS");
      idleAnimation = avalibleIdleAnimations[Math.floor(Math.random() * avalibleIdleAnimations.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 120) {
          resetIdleAnimation();
        }
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
        break;
      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.hypot(diffX, diffY);

    if (distance <= 48.01) {
      idle();
      return;
    }

    idleAnimation = null;
    idleTime = 0;

    if (idleAnimationFrame > 1) {
      setSprite("alert", 0);
      idleAnimationFrame = Math.min(idleAnimationFrame, 7);
      idleAnimationFrame -= 1;
      return;
    }

    let direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction || "idle", frameCount);
  }

  init();
})();

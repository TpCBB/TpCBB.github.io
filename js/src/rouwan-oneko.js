// oneko.js: https://github.com/adryd325/oneko.js

(function oneko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

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

  function init() {
    let nekoFile = "./oneko.gif"
    const curScript = document.currentScript
    if (curScript && curScript.dataset.cat) {
      nekoFile = curScript.dataset.cat
    }
    // Keep the cat in this tab's last viewport position across page loads.
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
    } catch (error) {
      // Storage may be unavailable; the cat can still start normally.
    }
    if (!nekoEl.style.backgroundPosition) setSprite("idle", 0);

    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = "32px";
    nekoEl.style.height = "32px";
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "none";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 999;
    nekoEl.style.transform = "scale(1.6)";
    nekoEl.style.filter = "drop-shadow(1px 1px 0 rgba(17,17,17,.12))";

    nekoEl.style.backgroundImage = `url(${nekoFile})`;
    
    document.body.appendChild(nekoEl);

    document.addEventListener("mousemove", function (event) {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });
    
    window.addEventListener("pagehide", function () {
      try {
        window.sessionStorage.setItem("rouwan-position", JSON.stringify({
          x: nekoPosX, y: nekoPosY, mouseX: mousePosX, mouseY: mousePosY,
          sprite: nekoEl.style.backgroundPosition
        }));
      } catch (error) {
        // Continue without persistence if storage is unavailable.
      }
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;
  let lastMoveTimestamp;

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) return;
    const elapsed = lastMoveTimestamp ? Math.min((timestamp - lastMoveTimestamp) / 1000, 0.05) : 0;
    lastMoveTimestamp = timestamp;
    const dx = mousePosX - nekoPosX;
    const dy = mousePosY - nekoPosY;
    const distance = Math.hypot(dx, dy);
    if (distance > 48) {
      const step = Math.min(nekoSpeed * elapsed, distance - 48);
      nekoPosX += dx / distance * step;
      nekoPosY += dy / distance * step;
    }
    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;

    if (!lastFrameTimestamp || timestamp - lastFrameTimestamp >= 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    // every ~ 20 seconds
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) == 0 &&
      idleAnimation == null
    ) {
      let avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) {
        avalibleIdleAnimations.push("scratchWallW");
      }
      if (nekoPosY < 32) {
        avalibleIdleAnimations.push("scratchWallN");
      }
      if (nekoPosX > window.innerWidth - 32) {
        avalibleIdleAnimations.push("scratchWallE");
      }
      if (nekoPosY > window.innerHeight - 32) {
        avalibleIdleAnimations.push("scratchWallS");
      }
      idleAnimation =
        avalibleIdleAnimations[
          Math.floor(Math.random() * avalibleIdleAnimations.length)
        ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) {
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
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance <= 48.01) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    idleTime = 0;

    let direction;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);


  }

  init();
})();

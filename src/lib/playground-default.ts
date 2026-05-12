export const DEFAULT_PLAYGROUND_CODE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    background:
      linear-gradient(to bottom,
        #050118 0%,
        #1e1b4b 28%,
        #312e81 55%,
        #312e3d 78%,
        #0b3a2a 100%);
    overflow: hidden;
    font-family: system-ui, sans-serif;
    position: relative;
  }

  /* ===== Soft world glow / moonlight ===== */
  .world {
    position: absolute;
    top: 12%;
    left: 50%;
    width: 75%;
    height: 55%;
    transform: translateX(-50%);
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 50%,
        rgba(99,102,241,0.45) 0%,
        rgba(34,211,238,0.28) 35%,
        rgba(245,158,11,0.14) 60%,
        transparent 75%);
    filter: blur(30px);
    animation: world-pulse 9s ease-in-out infinite;
  }
  @keyframes world-pulse {
    0%,100% { opacity: 0.85; transform: translateX(-50%) scale(1); }
    50%     { opacity: 1;    transform: translateX(-50%) scale(1.05); }
  }

  /* ===== Moon ===== */
  .moon {
    position: absolute;
    top: 9%;
    right: 14%;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fff7d6, #fcd34d 70%, #f59e0b);
    box-shadow:
      0 0 24px rgba(252,211,77,0.55),
      0 0 60px rgba(252,211,77,0.25);
  }

  /* ===== Stars ===== */
  .star {
    position: absolute;
    width: 2px; height: 2px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 4px #fff;
    animation: twinkle 3s ease-in-out infinite;
  }
  @keyframes twinkle {
    0%,100% { opacity: 0.25; }
    50%     { opacity: 1; }
  }

  /* ===== Ground / garden ===== */
  .ground {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 28%;
    background:
      linear-gradient(to bottom,
        rgba(6,78,59,0.0) 0%,
        rgba(6,78,59,0.85) 20%,
        rgba(3,55,42,1) 70%,
        rgba(2,40,30,1) 100%);
  }
  .grass-row {
    position: absolute;
    left: 0; right: 0; bottom: 28%;
    height: 14px;
    background:
      radial-gradient(ellipse 5px 12px at 4% 100%,  #166534, transparent),
      radial-gradient(ellipse 4px 10px at 10% 100%, #15803d, transparent),
      radial-gradient(ellipse 6px 14px at 16% 100%, #166534, transparent),
      radial-gradient(ellipse 4px 9px  at 22% 100%, #15803d, transparent),
      radial-gradient(ellipse 5px 13px at 28% 100%, #166534, transparent),
      radial-gradient(ellipse 4px 11px at 34% 100%, #15803d, transparent),
      radial-gradient(ellipse 5px 12px at 42% 100%, #166534, transparent),
      radial-gradient(ellipse 6px 15px at 48% 100%, #15803d, transparent),
      radial-gradient(ellipse 4px 10px at 56% 100%, #166534, transparent),
      radial-gradient(ellipse 5px 12px at 64% 100%, #15803d, transparent),
      radial-gradient(ellipse 5px 14px at 72% 100%, #166534, transparent),
      radial-gradient(ellipse 4px 9px  at 80% 100%, #15803d, transparent),
      radial-gradient(ellipse 6px 13px at 88% 100%, #166534, transparent),
      radial-gradient(ellipse 4px 11px at 95% 100%, #15803d, transparent);
  }

  /* ===== Flower stem (ដើម) ===== */
  .plant {
    position: absolute;
    bottom: 28%;
    transform-origin: bottom center;
    animation: sway 6s ease-in-out infinite;
  }
  .plant.p1 { left: 12%; height: 58%; animation-delay: 0s;   }
  .plant.p2 { left: 30%; height: 70%; animation-delay: 1.1s; }
  .plant.p3 { left: 50%; height: 62%; animation-delay: 0.4s; }
  .plant.p4 { left: 70%; height: 76%; animation-delay: 1.6s; }
  .plant.p5 { left: 86%; height: 52%; animation-delay: 0.8s; }

  @keyframes sway {
    0%,100% { transform: rotate(-1.8deg); }
    50%     { transform: rotate(1.8deg); }
  }

  .stem {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 4px;
    height: 100%;
    background: linear-gradient(to top, #14532d 0%, #166534 35%, #16a34a 80%, #22c55e 100%);
    border-radius: 2px;
    transform: translateX(-50%) scaleY(0);
    transform-origin: bottom center;
    animation: grow 1.8s cubic-bezier(.2,.7,.2,1) forwards;
    box-shadow: 0 0 4px rgba(34,197,94,0.3);
  }
  @keyframes grow { to { transform: translateX(-50%) scaleY(1); } }

  .leaf {
    position: absolute;
    width: 22px; height: 12px;
    background: linear-gradient(135deg, #22c55e, #166534);
    transform-origin: 100% 50%;
    opacity: 0;
    animation: leaf-pop 1s ease-out forwards;
    animation-delay: 1.5s;
  }
  .leaf.left  { right: 50%; bottom: 35%; border-radius: 100% 0 0 100%; transform: rotate(-35deg) scale(0); }
  .leaf.right { left:  50%; bottom: 52%; border-radius: 0 100% 100% 0; transform: rotate(35deg)  scale(0); background: linear-gradient(225deg, #22c55e, #166534); }

  @keyframes leaf-pop {
    to { opacity: 1; transform: var(--final, rotate(-35deg) scale(1)); }
  }
  .leaf.left  { --final: rotate(-35deg) scale(1); }
  .leaf.right { --final: rotate(35deg)  scale(1); }

  /* ===== Flower head ===== */
  .bloom {
    position: absolute;
    top: -32px;
    left: 50%;
    width: 90px;
    height: 90px;
    transform: translateX(-50%);
  }
  .plant.p3 .bloom { width: 110px; height: 110px; top: -42px; }
  .plant.p4 .bloom { width: 96px;  height: 96px;  top: -36px; }
  .plant.p5 .bloom { width: 78px;  height: 78px;  top: -28px; }

  .petal {
    position: absolute;
    width: 28px; height: 50px;
    bottom: 50%;
    left: calc(50% - 14px);
    border-radius: 50% 50% 30% 30% / 70% 70% 30% 30%;
    transform-origin: 50% 100%;
    opacity: 0;
    transform: rotate(var(--r,0deg)) scale(0);
    animation: bloom 1.6s cubic-bezier(.2,.7,.2,1) forwards;
    animation-delay: calc(2.2s + var(--d, 0s));
  }
  @keyframes bloom {
    to { opacity: 1; transform: rotate(var(--r,0deg)) scale(1); }
  }

  .core {
    position: absolute;
    top: calc(50% - 13px);
    left: calc(50% - 13px);
    width: 26px; height: 26px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fef3c7, #f59e0b 65%, #b45309);
    box-shadow: 0 0 14px rgba(252,211,77,0.8);
    opacity: 0;
    animation: fade-in 1.1s ease-out forwards;
    animation-delay: 3.2s;
    z-index: 2;
  }
  @keyframes fade-in { to { opacity: 1; } }

  /* Per-flower palettes */
  .pink   .petal { background: linear-gradient(180deg, #f9a8d4 0%, #fb7185 50%, #f97316 100%); filter: drop-shadow(0 0 10px rgba(251,113,133,0.55)); }
  .violet .petal { background: linear-gradient(180deg, #d8b4fe 0%, #a855f7 50%, #6366f1 100%); filter: drop-shadow(0 0 10px rgba(168,85,247,0.55)); }
  .sun    .petal { background: linear-gradient(180deg, #fde68a 0%, #fbbf24 50%, #ea580c 100%); filter: drop-shadow(0 0 10px rgba(251,191,36,0.55)); }
  .sky    .petal { background: linear-gradient(180deg, #bae6fd 0%, #38bdf8 50%, #6366f1 100%); filter: drop-shadow(0 0 10px rgba(56,189,248,0.55)); }
  .ruby   .petal { background: linear-gradient(180deg, #fda4af 0%, #ef4444 50%, #b91c1c 100%); filter: drop-shadow(0 0 10px rgba(239,68,68,0.55)); }

  /* Drifting sparkles / fireflies */
  .firefly {
    position: absolute;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 10px #fef3c7, 0 0 20px rgba(252,211,77,0.6);
    opacity: 0;
    animation: drift 6s ease-in-out infinite;
  }
  @keyframes drift {
    0%   { transform: translate(0, 0) scale(0.7); opacity: 0; }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translate(var(--mx,30px), var(--my,-80px)) scale(1.1); opacity: 0; }
  }
</style>
</head>
<body>
  <!-- Sky / world -->
  <div class="world"></div>
  <div class="moon"></div>

  <!-- Stars -->
  <span class="star" style="left:  6%; top:  6%;"></span>
  <span class="star" style="left: 18%; top: 12%; animation-delay: 0.6s;"></span>
  <span class="star" style="left: 30%; top:  4%; animation-delay: 1.2s;"></span>
  <span class="star" style="left: 44%; top:  9%; animation-delay: 1.8s;"></span>
  <span class="star" style="left: 60%; top:  5%; animation-delay: 0.3s;"></span>
  <span class="star" style="left: 78%; top: 16%; animation-delay: 1.4s;"></span>
  <span class="star" style="left: 92%; top:  8%; animation-delay: 0.9s;"></span>

  <!-- Garden -->
  <div class="ground"></div>
  <div class="grass-row"></div>

  <!-- Flowers blooming in the garden -->
  <div class="plant p1 pink">
    <div class="stem"></div>
    <div class="leaf left"></div>
    <div class="leaf right"></div>
    <div class="bloom">
      <span class="petal" style="--r:   0deg; --d: 0.00s"></span>
      <span class="petal" style="--r:  60deg; --d: 0.08s"></span>
      <span class="petal" style="--r: 120deg; --d: 0.16s"></span>
      <span class="petal" style="--r: 180deg; --d: 0.24s"></span>
      <span class="petal" style="--r: 240deg; --d: 0.32s"></span>
      <span class="petal" style="--r: 300deg; --d: 0.40s"></span>
      <span class="core"></span>
    </div>
  </div>

  <div class="plant p2 violet">
    <div class="stem"></div>
    <div class="leaf left"></div>
    <div class="leaf right"></div>
    <div class="bloom">
      <span class="petal" style="--r:   0deg; --d: 0.10s"></span>
      <span class="petal" style="--r:  45deg; --d: 0.18s"></span>
      <span class="petal" style="--r:  90deg; --d: 0.26s"></span>
      <span class="petal" style="--r: 135deg; --d: 0.34s"></span>
      <span class="petal" style="--r: 180deg; --d: 0.42s"></span>
      <span class="petal" style="--r: 225deg; --d: 0.50s"></span>
      <span class="petal" style="--r: 270deg; --d: 0.58s"></span>
      <span class="petal" style="--r: 315deg; --d: 0.66s"></span>
      <span class="core"></span>
    </div>
  </div>

  <div class="plant p3 sun">
    <div class="stem"></div>
    <div class="leaf left"></div>
    <div class="leaf right"></div>
    <div class="bloom">
      <span class="petal" style="--r:   0deg; --d: 0.00s"></span>
      <span class="petal" style="--r:  60deg; --d: 0.08s"></span>
      <span class="petal" style="--r: 120deg; --d: 0.16s"></span>
      <span class="petal" style="--r: 180deg; --d: 0.24s"></span>
      <span class="petal" style="--r: 240deg; --d: 0.32s"></span>
      <span class="petal" style="--r: 300deg; --d: 0.40s"></span>
      <span class="core"></span>
    </div>
  </div>

  <div class="plant p4 sky">
    <div class="stem"></div>
    <div class="leaf left"></div>
    <div class="leaf right"></div>
    <div class="bloom">
      <span class="petal" style="--r:   0deg; --d: 0.05s"></span>
      <span class="petal" style="--r:  72deg; --d: 0.15s"></span>
      <span class="petal" style="--r: 144deg; --d: 0.25s"></span>
      <span class="petal" style="--r: 216deg; --d: 0.35s"></span>
      <span class="petal" style="--r: 288deg; --d: 0.45s"></span>
      <span class="core"></span>
    </div>
  </div>

  <div class="plant p5 ruby">
    <div class="stem"></div>
    <div class="leaf left"></div>
    <div class="leaf right"></div>
    <div class="bloom">
      <span class="petal" style="--r:   0deg; --d: 0.00s"></span>
      <span class="petal" style="--r:  60deg; --d: 0.08s"></span>
      <span class="petal" style="--r: 120deg; --d: 0.16s"></span>
      <span class="petal" style="--r: 180deg; --d: 0.24s"></span>
      <span class="petal" style="--r: 240deg; --d: 0.32s"></span>
      <span class="petal" style="--r: 300deg; --d: 0.40s"></span>
      <span class="core"></span>
    </div>
  </div>

  <!-- Fireflies drifting through the garden -->
  <span class="firefly" style="left: 25%; top: 60%; --mx:  40px; --my: -100px; animation-delay: 0s;"></span>
  <span class="firefly" style="left: 55%; top: 70%; --mx: -50px; --my: -120px; animation-delay: 2s;"></span>
  <span class="firefly" style="left: 78%; top: 55%; --mx:  20px; --my: -90px;  animation-delay: 3.5s;"></span>
  <span class="firefly" style="left: 12%; top: 75%; --mx:  60px; --my: -110px; animation-delay: 4.5s;"></span>
</body>
</html>`;

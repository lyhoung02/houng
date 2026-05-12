export const DEFAULT_PLAYGROUND_CODE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  :root {
    --scene-w: min(100vw, 1200px);
    --scene-h: 100vh;
    --u: min(1vw, 12px);          /* responsive base unit */
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; overflow: hidden; }
  body {
    font-family: system-ui, sans-serif;
    background:
      radial-gradient(ellipse 80% 50% at 50% 22%, rgba(165,180,252,0.20), transparent 60%),
      linear-gradient(to bottom,
        #02030f 0%,
        #0b1029 18%,
        #1e1b4b 42%,
        #312e81 62%,
        #103a3a 80%,
        #062017 100%);
    position: relative;
  }

  .stage { position: absolute; inset: 0; }

  /* ============== Stars ============== */
  .star {
    position: absolute;
    width: 2px; height: 2px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 4px #fff, 0 0 10px rgba(255,255,255,0.6);
    animation: twinkle 3.5s ease-in-out infinite;
  }
  .star.big { width: 3px; height: 3px; box-shadow: 0 0 6px #fff, 0 0 16px rgba(255,255,255,0.8); }
  @keyframes twinkle {
    0%,100% { opacity: 0.25; transform: scale(0.85); }
    50%     { opacity: 1;    transform: scale(1); }
  }

  /* ============== Moon ============== */
  .moon-stage {
    position: absolute;
    top: 7%; right: 13%;
    width: calc(var(--u) * 8); height: calc(var(--u) * 8);
    min-width: 60px; min-height: 60px;
  }
  .moon-halo {
    position: absolute;
    inset: -55%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(254,243,199,0.45) 0%, rgba(252,211,77,0.18) 35%, transparent 65%);
    animation: halo 6s ease-in-out infinite;
  }
  .moon {
    position: absolute; inset: 12%;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 32%, #fffbeb 0%, #fef3c7 35%, #fbbf24 75%, #d97706 100%);
    box-shadow:
      inset -3px -5px 12px rgba(146,64,14,0.35),
      0 0 24px rgba(252,211,77,0.55),
      0 0 60px rgba(252,211,77,0.25);
  }
  @keyframes halo { 0%,100% { opacity: 0.9; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }

  /* ============== Mountains ============== */
  .mountains {
    position: absolute; left: 0; right: 0;
    bottom: 28%; height: 18%;
  }
  .mountains svg { width: 100%; height: 100%; display: block; }

  /* ============== Mist ============== */
  .mist {
    position: absolute;
    left: -10%; right: -10%; bottom: 26%;
    height: 12%;
    background:
      radial-gradient(ellipse 30% 100% at 15% 50%, rgba(186,230,253,0.22), transparent 70%),
      radial-gradient(ellipse 32% 100% at 55% 70%, rgba(165,180,252,0.18), transparent 70%),
      radial-gradient(ellipse 28% 100% at 85% 50%, rgba(186,230,253,0.22), transparent 70%);
    filter: blur(8px);
    animation: drift 18s ease-in-out infinite alternate;
  }
  @keyframes drift { 0% { transform: translateX(-25px); } 100% { transform: translateX(25px); } }

  /* ============== Ground ============== */
  .ground {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 28%;
    background: linear-gradient(to bottom,
      rgba(6,78,59,0)   0%,
      rgba(6,78,59,0.65) 10%,
      rgba(4,55,42,0.95) 35%,
      rgba(2,28,21,1)   100%);
  }
  .ground::before {
    content: ""; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 16% at 50% 0%, rgba(34,197,94,0.22), transparent 70%);
  }

  /* ============== Grass blades ============== */
  .grass { position: absolute; left: 0; right: 0; pointer-events: none; }
  .grass.back  { bottom: 25%; height: 16px; opacity: 0.7; filter: blur(0.4px); }
  .grass.front { bottom: 24%; height: 22px; }
  .blade {
    position: absolute;
    bottom: 0;
    width: 3px;
    background: linear-gradient(to top, #052e1a, #166534, #22c55e);
    border-radius: 50% 50% 30% 30% / 80% 80% 20% 20%;
    transform-origin: bottom center;
    animation: bladeSway 4s ease-in-out infinite;
  }
  @keyframes bladeSway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }

  /* ============== Plant / flower stem & leaves ============== */
  .plant {
    position: absolute;
    bottom: 25%;
    transform-origin: bottom center;
    animation: plantSway 7s ease-in-out infinite;
  }
  @keyframes plantSway { 0%,100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.4deg); } }

  .stem {
    position: absolute;
    bottom: 0; left: 50%;
    width: 4px; height: 100%;
    background:
      linear-gradient(90deg, rgba(0,0,0,0.35) 0%, transparent 35%, rgba(255,255,255,0.18) 60%, transparent 80%),
      linear-gradient(to top, #052e1a 0%, #14532d 35%, #15803d 70%, #22c55e 100%);
    border-radius: 3px;
    transform: translateX(-50%) scaleY(0);
    transform-origin: bottom center;
    animation: grow 2.2s cubic-bezier(.2,.7,.2,1) forwards;
    box-shadow: 0 0 6px rgba(34,197,94,0.35);
  }
  @keyframes grow { to { transform: translateX(-50%) scaleY(1); } }

  /* Leaves are anchored along the stem (centre 50%) so they sway with the plant */
  .leaf {
    position: absolute;
    left: 50%;
    width: calc(var(--u) * 3); height: calc(var(--u) * 1.4);
    min-width: 22px; min-height: 10px;
    transform-origin: 0 50%;
    opacity: 0;
    animation: leafPop 1.3s cubic-bezier(.2,.7,.2,1) forwards;
  }
  .leaf-body {
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, #4ade80 0%, #16a34a 45%, #052e1a 100%);
    border-radius: 100% 70% 60% 100% / 100% 60% 100% 100%;
    box-shadow:
      inset -2px -2px 4px rgba(0,0,0,0.45),
      inset 2px 2px 3px rgba(255,255,255,0.18);
  }
  .leaf-body::after {
    content: "";
    position: absolute; left: 6%; top: 50%;
    width: 80%; height: 1px;
    background: linear-gradient(to right, rgba(255,255,255,0.5), transparent);
    transform: translateY(-50%);
  }
  .leaf.l1 { bottom: 38%; transform: rotate(28deg) scale(0);  animation-delay: 1.5s; }
  .leaf.l2 { bottom: 55%; transform: rotate(-28deg) scale(0); animation-delay: 1.8s; }
  .leaf.l2 .leaf-body { transform: scaleX(-1); }
  @keyframes leafPop {
    to { opacity: 1; transform: rotate(var(--lr)) scale(1); }
  }
  .leaf.l1 { --lr: 28deg; }
  .leaf.l2 { --lr: -28deg; }

  /* ============== Flower head ============== */
  .bloom {
    position: absolute; left: 50%;
    width: calc(var(--u) * 11);
    height: calc(var(--u) * 11);
    min-width: 88px; min-height: 88px;
    transform: translateX(-50%);
    opacity: 0;
    animation: bloomFade 1.2s ease-out forwards;
    animation-delay: 2.3s;
  }
  @keyframes bloomFade { to { opacity: 1; } }
  .bloom svg { width: 100%; height: 100%; display: block; overflow: visible; }

  /* Flower sizes per plant */
  .plant.p1 .bloom { top: calc(var(--u) * -6); }
  .plant.p2 .bloom { width: calc(var(--u) * 12); height: calc(var(--u) * 12); top: calc(var(--u) * -7); min-width: 96px; min-height: 96px; }
  .plant.p3 .bloom { width: calc(var(--u) * 13); height: calc(var(--u) * 13); top: calc(var(--u) * -7.5); min-width: 104px; min-height: 104px; }
  .plant.p4 .bloom { width: calc(var(--u) * 11.5); height: calc(var(--u) * 11.5); top: calc(var(--u) * -6.5); min-width: 92px; min-height: 92px; }
  .plant.p5 .bloom { width: calc(var(--u) * 10); height: calc(var(--u) * 10); top: calc(var(--u) * -5.5); min-width: 80px; min-height: 80px; }

  /* Aura glow behind the flower */
  .aura {
    position: absolute; inset: -25%;
    border-radius: 50%;
    opacity: 0; z-index: -1;
    filter: blur(20px);
    animation: auraIn 2s ease-out forwards, auraPulse 4.5s ease-in-out infinite;
    animation-delay: 2.6s, 4.6s;
  }
  @keyframes auraIn { to { opacity: 0.8; } }
  @keyframes auraPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
  .pink   .aura { background: radial-gradient(circle, rgba(251,113,133,0.55), transparent 70%); }
  .violet .aura { background: radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%); }
  .sun    .aura { background: radial-gradient(circle, rgba(251,191,36,0.65), transparent 70%); }
  .sky    .aura { background: radial-gradient(circle, rgba(56,189,248,0.55), transparent 70%); }
  .ruby   .aura { background: radial-gradient(circle, rgba(239,68,68,0.55),  transparent 70%); }

  /* Ground shadow under each plant */
  .ground-shadow {
    position: absolute;
    bottom: -8px;
    left: 50%;
    width: calc(var(--u) * 6);
    height: 8px;
    transform: translateX(-50%);
    background: radial-gradient(ellipse at center, rgba(0,0,0,0.4), transparent 70%);
    filter: blur(2px);
  }

  /* Plant positions */
  .plant.p1 { left: 12%; height: 50%; animation-delay: 0s;   }
  .plant.p2 { left: 28%; height: 60%; animation-delay: 1.2s; }
  .plant.p3 { left: 48%; height: 56%; animation-delay: 0.5s; }
  .plant.p4 { left: 68%; height: 64%; animation-delay: 1.8s; }
  .plant.p5 { left: 86%; height: 46%; animation-delay: 0.9s; }

  /* ============== Particles ============== */
  .firefly {
    position: absolute;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #fef3c7;
    box-shadow: 0 0 10px #fef3c7, 0 0 24px rgba(252,211,77,0.7);
    opacity: 0;
    animation: fly 7s ease-in-out infinite;
  }
  @keyframes fly {
    0%   { transform: translate(0,0) scale(0.7); opacity: 0; }
    15%  { opacity: 1; }
    50%  { transform: translate(var(--fmx,30px), var(--fmy,-50px)) scale(1.1); }
    85%  { opacity: 1; }
    100% { transform: translate(var(--fmx2,-10px), var(--fmy2,-110px)) scale(0.8); opacity: 0; }
  }
  .pollen {
    position: absolute;
    width: 2px; height: 2px;
    background: rgba(254,243,199,0.85);
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(252,211,77,0.6);
    opacity: 0;
    animation: pollen 11s linear infinite;
  }
  @keyframes pollen {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    20%  { opacity: 0.9; }
    100% { transform: translateY(-80vh) translateX(var(--px,40px)); opacity: 0; }
  }
</style>
</head>
<body>
  <div class="stage">

    <!-- Stars -->
    <span class="star big" style="left:  6%; top:  6%;"></span>
    <span class="star"     style="left: 16%; top: 12%; animation-delay: 0.6s;"></span>
    <span class="star"     style="left: 26%; top:  5%; animation-delay: 1.2s;"></span>
    <span class="star big" style="left: 36%; top: 14%; animation-delay: 1.8s;"></span>
    <span class="star"     style="left: 50%; top:  4%; animation-delay: 0.3s;"></span>
    <span class="star"     style="left: 58%; top: 16%; animation-delay: 1.4s;"></span>
    <span class="star big" style="left: 72%; top:  3%; animation-delay: 0.9s;"></span>
    <span class="star"     style="left: 84%; top: 14%; animation-delay: 2.2s;"></span>
    <span class="star"     style="left: 94%; top:  7%; animation-delay: 1.6s;"></span>

    <!-- Moon -->
    <div class="moon-stage">
      <div class="moon-halo"></div>
      <div class="moon"></div>
    </div>

    <!-- Mountains -->
    <div class="mountains">
      <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path d="M0 200 L0 130 L80 90 L160 110 L240 70 L320 100 L400 60 L480 95 L560 75 L640 110 L720 80 L800 100 L880 70 L960 105 L1000 90 L1000 200 Z" fill="rgba(15,23,42,0.6)"/>
        <path d="M0 200 L0 160 L60 130 L140 150 L220 120 L300 145 L380 115 L460 140 L540 110 L620 145 L700 125 L780 140 L860 115 L940 145 L1000 130 L1000 200 Z" fill="rgba(8,15,30,0.9)"/>
      </svg>
    </div>

    <!-- Mist + ground + grass -->
    <div class="mist"></div>
    <div class="ground"></div>

    <div class="grass back">
      <span class="blade" style="left: 4%;  height: 12px; animation-delay: 0.1s;"></span>
      <span class="blade" style="left: 10%; height: 14px; animation-delay: 0.4s;"></span>
      <span class="blade" style="left: 18%; height: 11px; animation-delay: 0.7s;"></span>
      <span class="blade" style="left: 24%; height: 13px; animation-delay: 1.0s;"></span>
      <span class="blade" style="left: 33%; height: 12px; animation-delay: 1.3s;"></span>
      <span class="blade" style="left: 40%; height: 14px; animation-delay: 1.6s;"></span>
      <span class="blade" style="left: 50%; height: 11px; animation-delay: 1.9s;"></span>
      <span class="blade" style="left: 58%; height: 14px; animation-delay: 2.2s;"></span>
      <span class="blade" style="left: 66%; height: 12px; animation-delay: 0.5s;"></span>
      <span class="blade" style="left: 76%; height: 13px; animation-delay: 0.8s;"></span>
      <span class="blade" style="left: 84%; height: 14px; animation-delay: 1.1s;"></span>
      <span class="blade" style="left: 92%; height: 12px; animation-delay: 1.4s;"></span>
    </div>
    <div class="grass front">
      <span class="blade" style="left: 6%;  height: 20px; animation-delay: 0.2s;"></span>
      <span class="blade" style="left: 14%; height: 18px; animation-delay: 0.5s;"></span>
      <span class="blade" style="left: 22%; height: 22px; animation-delay: 0.8s;"></span>
      <span class="blade" style="left: 32%; height: 19px; animation-delay: 1.1s;"></span>
      <span class="blade" style="left: 42%; height: 21px; animation-delay: 1.4s;"></span>
      <span class="blade" style="left: 52%; height: 18px; animation-delay: 1.7s;"></span>
      <span class="blade" style="left: 62%; height: 22px; animation-delay: 2.0s;"></span>
      <span class="blade" style="left: 74%; height: 19px; animation-delay: 0.6s;"></span>
      <span class="blade" style="left: 88%; height: 20px; animation-delay: 0.9s;"></span>
    </div>

    <!-- Shared SVG defs (gradients + filters) — reused by each flower below -->
    <svg width="0" height="0" style="position:absolute">
      <defs>
        <!-- Drop shadow + glow filter for the flower head -->
        <filter id="petalShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="3" result="off"/>
          <feFlood flood-color="#000" flood-opacity="0.45"/>
          <feComposite in2="off" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Specular sheen overlay -->
        <radialGradient id="sheen" cx="35%" cy="25%" r="55%">
          <stop offset="0%"  stop-color="rgba(255,255,255,0.85)"/>
          <stop offset="40%" stop-color="rgba(255,255,255,0.18)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>

        <!-- Petal palettes — each has a top highlight, mid body and dark base for 3D feel -->
        <linearGradient id="g-pink-front" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#fff1f5"/>
          <stop offset="18%" stop-color="#fbcfe8"/>
          <stop offset="50%" stop-color="#fb7185"/>
          <stop offset="85%" stop-color="#9f1239"/>
          <stop offset="100%" stop-color="#4a0420"/>
        </linearGradient>
        <linearGradient id="g-pink-back" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#fbcfe8"/>
          <stop offset="60%" stop-color="#be185d"/>
          <stop offset="100%" stop-color="#2d0612"/>
        </linearGradient>

        <linearGradient id="g-violet-front" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#faf5ff"/>
          <stop offset="20%" stop-color="#e9d5ff"/>
          <stop offset="55%" stop-color="#a855f7"/>
          <stop offset="85%" stop-color="#5b21b6"/>
          <stop offset="100%" stop-color="#220b4a"/>
        </linearGradient>
        <linearGradient id="g-violet-back" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#d8b4fe"/>
          <stop offset="60%" stop-color="#6d28d9"/>
          <stop offset="100%" stop-color="#170632"/>
        </linearGradient>

        <linearGradient id="g-sun-front" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#fffbeb"/>
          <stop offset="20%" stop-color="#fef3c7"/>
          <stop offset="55%" stop-color="#fbbf24"/>
          <stop offset="85%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
        <linearGradient id="g-sun-back" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#fef3c7"/>
          <stop offset="60%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#3d1606"/>
        </linearGradient>

        <linearGradient id="g-sky-front" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#f0f9ff"/>
          <stop offset="20%" stop-color="#bae6fd"/>
          <stop offset="55%" stop-color="#38bdf8"/>
          <stop offset="85%" stop-color="#1e40af"/>
          <stop offset="100%" stop-color="#0a0f3a"/>
        </linearGradient>
        <linearGradient id="g-sky-back" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#bae6fd"/>
          <stop offset="60%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#050a25"/>
        </linearGradient>

        <linearGradient id="g-ruby-front" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#fff1f1"/>
          <stop offset="20%" stop-color="#fecaca"/>
          <stop offset="55%" stop-color="#ef4444"/>
          <stop offset="85%" stop-color="#7f1d1d"/>
          <stop offset="100%" stop-color="#2a0606"/>
        </linearGradient>
        <linearGradient id="g-ruby-back" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"  stop-color="#fecaca"/>
          <stop offset="60%" stop-color="#991b1b"/>
          <stop offset="100%" stop-color="#220404"/>
        </linearGradient>

        <!-- 3D sun-core gradient (used by every flower's center) -->
        <radialGradient id="g-core" cx="32%" cy="32%" r="70%">
          <stop offset="0%"  stop-color="#ffffff"/>
          <stop offset="20%" stop-color="#fef3c7"/>
          <stop offset="55%" stop-color="#fbbf24"/>
          <stop offset="85%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#451a03"/>
        </radialGradient>

        <!-- Petal shape — a teardrop that reads as 3D when paired with the gradients above -->
        <path id="petalShape" d="M0 -42 C 12 -38, 14 -18, 0 -6 C -14 -18, -12 -38, 0 -42 Z"/>
      </defs>
    </svg>

    <!-- ============== FLOWERS ============== -->
    <div class="plant p1 pink">
      <div class="stem"></div>
      <div class="ground-shadow"></div>
      <div class="leaf l1"><div class="leaf-body"></div></div>
      <div class="leaf l2"><div class="leaf-body"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="-60 -60 120 120">
          <g filter="url(#petalShadow)">
            <!-- back row (slightly rotated, darker, slightly larger) -->
            <g opacity="0.92">
              <use href="#petalShape" fill="url(#g-pink-back)" transform="rotate(30) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-pink-back)" transform="rotate(90) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-pink-back)" transform="rotate(150) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-pink-back)" transform="rotate(210) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-pink-back)" transform="rotate(270) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-pink-back)" transform="rotate(330) scale(1.1)"/>
            </g>
            <!-- front row -->
            <g>
              <use href="#petalShape" fill="url(#g-pink-front)" transform="rotate(0)"/>
              <use href="#petalShape" fill="url(#g-pink-front)" transform="rotate(60)"/>
              <use href="#petalShape" fill="url(#g-pink-front)" transform="rotate(120)"/>
              <use href="#petalShape" fill="url(#g-pink-front)" transform="rotate(180)"/>
              <use href="#petalShape" fill="url(#g-pink-front)" transform="rotate(240)"/>
              <use href="#petalShape" fill="url(#g-pink-front)" transform="rotate(300)"/>
            </g>
          </g>
          <!-- center sphere with 3D lighting -->
          <circle r="13" fill="url(#g-core)" filter="url(#petalShadow)"/>
          <circle r="13" fill="url(#sheen)"/>
        </svg>
      </div>
    </div>

    <div class="plant p2 violet">
      <div class="stem"></div>
      <div class="ground-shadow"></div>
      <div class="leaf l1"><div class="leaf-body"></div></div>
      <div class="leaf l2"><div class="leaf-body"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="-60 -60 120 120">
          <g filter="url(#petalShadow)">
            <g opacity="0.92">
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(22.5) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(67.5) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(112.5) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(157.5) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(202.5) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(247.5) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(292.5) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-violet-back)" transform="rotate(337.5) scale(1.1)"/>
            </g>
            <g>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(0)"/>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(45)"/>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(90)"/>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(135)"/>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(180)"/>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(225)"/>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(270)"/>
              <use href="#petalShape" fill="url(#g-violet-front)" transform="rotate(315)"/>
            </g>
          </g>
          <circle r="13" fill="url(#g-core)" filter="url(#petalShadow)"/>
          <circle r="13" fill="url(#sheen)"/>
        </svg>
      </div>
    </div>

    <div class="plant p3 sun">
      <div class="stem"></div>
      <div class="ground-shadow"></div>
      <div class="leaf l1"><div class="leaf-body"></div></div>
      <div class="leaf l2"><div class="leaf-body"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="-60 -60 120 120">
          <g filter="url(#petalShadow)">
            <g opacity="0.92">
              <use href="#petalShape" fill="url(#g-sun-back)" transform="rotate(30) scale(1.12)"/>
              <use href="#petalShape" fill="url(#g-sun-back)" transform="rotate(90) scale(1.12)"/>
              <use href="#petalShape" fill="url(#g-sun-back)" transform="rotate(150) scale(1.12)"/>
              <use href="#petalShape" fill="url(#g-sun-back)" transform="rotate(210) scale(1.12)"/>
              <use href="#petalShape" fill="url(#g-sun-back)" transform="rotate(270) scale(1.12)"/>
              <use href="#petalShape" fill="url(#g-sun-back)" transform="rotate(330) scale(1.12)"/>
            </g>
            <g>
              <use href="#petalShape" fill="url(#g-sun-front)" transform="rotate(0)"/>
              <use href="#petalShape" fill="url(#g-sun-front)" transform="rotate(60)"/>
              <use href="#petalShape" fill="url(#g-sun-front)" transform="rotate(120)"/>
              <use href="#petalShape" fill="url(#g-sun-front)" transform="rotate(180)"/>
              <use href="#petalShape" fill="url(#g-sun-front)" transform="rotate(240)"/>
              <use href="#petalShape" fill="url(#g-sun-front)" transform="rotate(300)"/>
            </g>
          </g>
          <circle r="14" fill="url(#g-core)" filter="url(#petalShadow)"/>
          <circle r="14" fill="url(#sheen)"/>
        </svg>
      </div>
    </div>

    <div class="plant p4 sky">
      <div class="stem"></div>
      <div class="ground-shadow"></div>
      <div class="leaf l1"><div class="leaf-body"></div></div>
      <div class="leaf l2"><div class="leaf-body"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="-60 -60 120 120">
          <g filter="url(#petalShadow)">
            <g opacity="0.92">
              <use href="#petalShape" fill="url(#g-sky-back)" transform="rotate(36) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-sky-back)" transform="rotate(108) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-sky-back)" transform="rotate(180) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-sky-back)" transform="rotate(252) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-sky-back)" transform="rotate(324) scale(1.1)"/>
            </g>
            <g>
              <use href="#petalShape" fill="url(#g-sky-front)" transform="rotate(0)"/>
              <use href="#petalShape" fill="url(#g-sky-front)" transform="rotate(72)"/>
              <use href="#petalShape" fill="url(#g-sky-front)" transform="rotate(144)"/>
              <use href="#petalShape" fill="url(#g-sky-front)" transform="rotate(216)"/>
              <use href="#petalShape" fill="url(#g-sky-front)" transform="rotate(288)"/>
            </g>
          </g>
          <circle r="12" fill="url(#g-core)" filter="url(#petalShadow)"/>
          <circle r="12" fill="url(#sheen)"/>
        </svg>
      </div>
    </div>

    <div class="plant p5 ruby">
      <div class="stem"></div>
      <div class="ground-shadow"></div>
      <div class="leaf l1"><div class="leaf-body"></div></div>
      <div class="leaf l2"><div class="leaf-body"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="-60 -60 120 120">
          <g filter="url(#petalShadow)">
            <g opacity="0.92">
              <use href="#petalShape" fill="url(#g-ruby-back)" transform="rotate(30) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-ruby-back)" transform="rotate(90) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-ruby-back)" transform="rotate(150) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-ruby-back)" transform="rotate(210) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-ruby-back)" transform="rotate(270) scale(1.1)"/>
              <use href="#petalShape" fill="url(#g-ruby-back)" transform="rotate(330) scale(1.1)"/>
            </g>
            <g>
              <use href="#petalShape" fill="url(#g-ruby-front)" transform="rotate(0)"/>
              <use href="#petalShape" fill="url(#g-ruby-front)" transform="rotate(60)"/>
              <use href="#petalShape" fill="url(#g-ruby-front)" transform="rotate(120)"/>
              <use href="#petalShape" fill="url(#g-ruby-front)" transform="rotate(180)"/>
              <use href="#petalShape" fill="url(#g-ruby-front)" transform="rotate(240)"/>
              <use href="#petalShape" fill="url(#g-ruby-front)" transform="rotate(300)"/>
            </g>
          </g>
          <circle r="12" fill="url(#g-core)" filter="url(#petalShadow)"/>
          <circle r="12" fill="url(#sheen)"/>
        </svg>
      </div>
    </div>

    <!-- Fireflies -->
    <span class="firefly" style="left: 18%; top: 60%; --fmx:  40px; --fmy: -60px; --fmx2:  10px; --fmy2: -130px; animation-delay: 0s;"></span>
    <span class="firefly" style="left: 36%; top: 70%; --fmx: -30px; --fmy: -80px; --fmx2:  30px; --fmy2: -140px; animation-delay: 1.5s;"></span>
    <span class="firefly" style="left: 55%; top: 55%; --fmx:  50px; --fmy: -50px; --fmx2: -20px; --fmy2: -120px; animation-delay: 3s;"></span>
    <span class="firefly" style="left: 74%; top: 65%; --fmx: -40px; --fmy: -70px; --fmx2:  20px; --fmy2: -130px; animation-delay: 4.5s;"></span>
    <span class="firefly" style="left: 88%; top: 58%; --fmx:  20px; --fmy: -90px; --fmx2: -30px; --fmy2: -140px; animation-delay: 6s;"></span>

    <!-- Pollen -->
    <span class="pollen" style="left: 12%; bottom: 28%; --px:  60px; animation-delay: 0.5s;"></span>
    <span class="pollen" style="left: 30%; bottom: 28%; --px: -40px; animation-delay: 2.5s;"></span>
    <span class="pollen" style="left: 48%; bottom: 28%; --px:  50px; animation-delay: 4.5s;"></span>
    <span class="pollen" style="left: 66%; bottom: 28%; --px: -30px; animation-delay: 6.5s;"></span>
    <span class="pollen" style="left: 82%; bottom: 28%; --px:  40px; animation-delay: 1.5s;"></span>

  </div>
</body>
</html>`;

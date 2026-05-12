export const DEFAULT_PLAYGROUND_CODE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; overflow: hidden; }
  body {
    background:
      radial-gradient(ellipse 80% 50% at 50% 22%, rgba(165,180,252,0.20), transparent 60%),
      linear-gradient(to bottom,
        #02030f 0%,
        #0b1029 18%,
        #1e1b4b 42%,
        #312e81 62%,
        #0f3a3a 80%,
        #0a2a1a 100%);
    font-family: system-ui, sans-serif;
    position: relative;
  }

  .stage { position: absolute; inset: 0; }

  /* ===== Stars ===== */
  .star {
    position: absolute;
    width: 2px; height: 2px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 4px #fff, 0 0 8px rgba(255,255,255,0.5);
    animation: twinkle 3.5s ease-in-out infinite;
  }
  .star.big { width: 3px; height: 3px; box-shadow: 0 0 6px #fff, 0 0 14px rgba(255,255,255,0.7); }
  @keyframes twinkle {
    0%,100% { opacity: 0.25; transform: scale(0.85); }
    50%     { opacity: 1;    transform: scale(1); }
  }

  /* ===== Moon with halo + light rays ===== */
  .moon-stage {
    position: absolute;
    top: 8%;
    right: 12%;
    width: 90px;
    height: 90px;
  }
  .moon-halo {
    position: absolute;
    inset: -60px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(254,243,199,0.45) 0%, rgba(252,211,77,0.18) 30%, transparent 60%);
    animation: halo-pulse 6s ease-in-out infinite;
  }
  .moon {
    position: absolute;
    inset: 18px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 32% 32%, #fffbeb 0%, #fef3c7 35%, #fbbf24 75%, #d97706 100%);
    box-shadow:
      inset -4px -6px 12px rgba(146,64,14,0.3),
      0 0 24px rgba(252,211,77,0.55),
      0 0 60px rgba(252,211,77,0.25);
  }
  .moon::before, .moon::after {
    content: "";
    position: absolute;
    background: rgba(180,83,9,0.18);
    border-radius: 50%;
  }
  .moon::before { width: 10px; height: 10px; top: 28%; left: 22%; }
  .moon::after  { width: 6px;  height: 6px;  bottom: 30%; right: 30%; box-shadow: -10px -4px 0 rgba(180,83,9,0.15); }
  @keyframes halo-pulse {
    0%,100% { opacity: 0.85; transform: scale(1); }
    50%     { opacity: 1;    transform: scale(1.08); }
  }

  /* ===== Mountain silhouettes (depth) ===== */
  .mountains {
    position: absolute;
    bottom: 28%;
    left: 0; right: 0;
    height: 30%;
    z-index: 1;
  }
  .mountains svg { width: 100%; height: 100%; display: block; }

  /* ===== Mist drifting along the ground ===== */
  .mist {
    position: absolute;
    bottom: 24%;
    left: -10%; right: -10%;
    height: 14%;
    background:
      radial-gradient(ellipse 30% 100% at 20% 50%, rgba(186,230,253,0.18), transparent 70%),
      radial-gradient(ellipse 35% 100% at 55% 70%, rgba(165,180,252,0.15), transparent 70%),
      radial-gradient(ellipse 28% 100% at 85% 50%, rgba(186,230,253,0.18), transparent 70%);
    filter: blur(8px);
    animation: drift-mist 18s ease-in-out infinite alternate;
    z-index: 2;
  }
  @keyframes drift-mist {
    0%   { transform: translateX(-25px); }
    100% { transform: translateX(25px); }
  }

  /* ===== Garden ground ===== */
  .ground {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 28%;
    background:
      linear-gradient(to bottom,
        rgba(6,78,59,0)   0%,
        rgba(6,78,59,0.7) 8%,
        rgba(3,55,42,0.95) 35%,
        rgba(2,30,22,1)   100%);
    z-index: 2;
  }
  .ground::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 14% at 50% 0%, rgba(34,197,94,0.18), transparent 70%);
  }

  /* Multi-layer grass */
  .grass {
    position: absolute;
    left: 0; right: 0;
    pointer-events: none;
    z-index: 3;
  }
  .grass.back  { bottom: 26%; height: 18px; opacity: 0.85; filter: blur(0.4px); }
  .grass.front { bottom: 25%; height: 24px; }

  .blade {
    position: absolute;
    bottom: 0;
    width: 3px;
    background: linear-gradient(to top, #052e1a, #166534, #22c55e);
    border-radius: 50% 50% 30% 30% / 80% 80% 20% 20%;
    transform-origin: bottom center;
    animation: blade-sway 4s ease-in-out infinite;
  }
  @keyframes blade-sway {
    0%,100% { transform: rotate(-3deg); }
    50%     { transform: rotate(3deg); }
  }

  /* ===== Flower plants ===== */
  .plant {
    position: absolute;
    bottom: 26%;
    transform-origin: bottom center;
    animation: sway 7s ease-in-out infinite;
    z-index: 4;
  }
  .plant.p1 { left: 10%; height: 56%; animation-delay: 0s;   }
  .plant.p2 { left: 26%; height: 68%; animation-delay: 1.2s; --hue: violet; }
  .plant.p3 { left: 44%; height: 60%; animation-delay: 0.5s; }
  .plant.p4 { left: 62%; height: 72%; animation-delay: 1.8s; }
  .plant.p5 { left: 80%; height: 54%; animation-delay: 0.9s; }
  .plant.tall { z-index: 5; }
  .plant.short { z-index: 4; }

  @keyframes sway {
    0%,100% { transform: rotate(-1.6deg); }
    50%     { transform: rotate(1.6deg); }
  }

  .stem-wrap {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    height: 100%;
    width: 6px;
  }
  .stem {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 5px;
    height: 100%;
    background:
      linear-gradient(90deg, rgba(0,0,0,0.25) 0%, transparent 35%, rgba(255,255,255,0.18) 60%, transparent 80%),
      linear-gradient(to top, #052e1a 0%, #14532d 35%, #15803d 70%, #22c55e 100%);
    border-radius: 3px;
    transform: translateX(-50%) scaleY(0);
    transform-origin: bottom center;
    animation: grow 2.2s cubic-bezier(.2,.7,.2,1) forwards;
    box-shadow: 0 0 6px rgba(34,197,94,0.35);
  }
  @keyframes grow { to { transform: translateX(-50%) scaleY(1); } }

  /* Detailed leaves with vein */
  .leaf {
    position: absolute;
    width: 36px;
    height: 18px;
    transform-origin: 0 50%;
    opacity: 0;
    animation: leaf-pop 1.4s cubic-bezier(.2,.7,.2,1) forwards;
  }
  .leaf-shape {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 100% at 0% 50%, #22c55e 0%, #166534 70%, #052e1a 100%);
    border-radius: 100% 70% 60% 100% / 100% 60% 100% 100%;
    box-shadow: inset 0 -2px 4px rgba(0,0,0,0.3);
  }
  .leaf-shape::before {
    content: "";
    position: absolute;
    left: 4%;
    top: 50%;
    width: 75%;
    height: 1px;
    background: linear-gradient(to right, rgba(255,255,255,0.4), transparent);
    transform: translateY(-50%);
  }
  .leaf.l1 { left: 52%; bottom: 38%; transform: rotate(28deg) scale(0); animation-delay: 1.6s; }
  .leaf.l2 { right: 52%; bottom: 55%; transform: rotate(152deg) scale(0); animation-delay: 1.9s; }
  .leaf.l2 .leaf-shape { transform: scaleX(-1); }
  @keyframes leaf-pop {
    to { opacity: 1; transform: rotate(var(--lr, 28deg)) scale(1); }
  }
  .leaf.l1 { --lr: 28deg; }
  .leaf.l2 { --lr: 152deg; }

  /* ===== Flower head ===== */
  .bloom {
    position: absolute;
    left: 50%;
    top: -52px;
    width: 120px;
    height: 120px;
    transform: translateX(-50%);
    opacity: 0;
    animation: bloom-fade 1.2s ease-out forwards;
    animation-delay: 2.3s;
    filter: drop-shadow(0 4px 14px rgba(0,0,0,0.4));
  }
  .plant.p3 .bloom { width: 134px; height: 134px; top: -60px; }
  .plant.p4 .bloom { width: 124px; height: 124px; top: -56px; }
  .plant.p5 .bloom { width: 100px; height: 100px; top: -44px; }
  @keyframes bloom-fade { to { opacity: 1; } }

  .bloom svg { width: 100%; height: 100%; display: block; overflow: visible; }

  /* Backing aura behind each flower */
  .aura {
    position: absolute;
    inset: -20%;
    border-radius: 50%;
    opacity: 0;
    filter: blur(18px);
    animation: aura-in 2s ease-out forwards, aura-pulse 4.5s ease-in-out infinite;
    animation-delay: 2.5s, 4.5s;
    z-index: -1;
  }
  @keyframes aura-in { to { opacity: 0.85; } }
  @keyframes aura-pulse {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.12); }
  }

  /* Per-flower palettes */
  .pink   .aura { background: radial-gradient(circle, rgba(251,113,133,0.55), transparent 70%); }
  .violet .aura { background: radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%); }
  .sun    .aura { background: radial-gradient(circle, rgba(251,191,36,0.65), transparent 70%); }
  .sky    .aura { background: radial-gradient(circle, rgba(56,189,248,0.55), transparent 70%); }
  .ruby   .aura { background: radial-gradient(circle, rgba(239,68,68,0.55),  transparent 70%); }

  /* ===== Fireflies ===== */
  .firefly {
    position: absolute;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #fef3c7;
    box-shadow: 0 0 10px #fef3c7, 0 0 24px rgba(252,211,77,0.7);
    opacity: 0;
    z-index: 6;
    animation: fly 7s ease-in-out infinite;
  }
  @keyframes fly {
    0%   { transform: translate(0,0) scale(0.7); opacity: 0; }
    15%  { opacity: 1; }
    50%  { transform: translate(var(--fmx, 30px), var(--fmy, -50px)) scale(1.1); }
    85%  { opacity: 1; }
    100% { transform: translate(var(--fmx2, -10px), var(--fmy2, -110px)) scale(0.8); opacity: 0; }
  }

  /* ===== Pollen / light particles drifting ===== */
  .pollen {
    position: absolute;
    width: 2px; height: 2px;
    background: rgba(254,243,199,0.85);
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(252,211,77,0.6);
    opacity: 0;
    animation: pollen-rise 9s linear infinite;
    z-index: 5;
  }
  @keyframes pollen-rise {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    20%  { opacity: 0.9; }
    100% { transform: translateY(-100vh) translateX(var(--px, 40px)); opacity: 0; }
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
    <span class="star"     style="left: 48%; top:  4%; animation-delay: 0.3s;"></span>
    <span class="star"     style="left: 56%; top: 18%; animation-delay: 1.4s;"></span>
    <span class="star big" style="left: 70%; top:  3%; animation-delay: 0.9s;"></span>
    <span class="star"     style="left: 82%; top: 14%; animation-delay: 2.2s;"></span>
    <span class="star"     style="left: 92%; top:  7%; animation-delay: 1.6s;"></span>

    <!-- Moon -->
    <div class="moon-stage">
      <div class="moon-halo"></div>
      <div class="moon"></div>
    </div>

    <!-- Mountains (depth) -->
    <div class="mountains">
      <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
        <!-- Distant range -->
        <path d="M0 200 L0 130 L80 90 L160 110 L240 70 L320 100 L400 60 L480 95 L560 75 L640 110 L720 80 L800 100 L880 70 L960 105 L1000 90 L1000 200 Z"
              fill="rgba(15,23,42,0.65)" />
        <!-- Mid range -->
        <path d="M0 200 L0 160 L60 130 L140 150 L220 120 L300 145 L380 115 L460 140 L540 110 L620 145 L700 125 L780 140 L860 115 L940 145 L1000 130 L1000 200 Z"
              fill="rgba(15,23,42,0.85)" />
      </svg>
    </div>

    <!-- Mist -->
    <div class="mist"></div>

    <!-- Ground -->
    <div class="ground"></div>

    <!-- Grass blades (back layer) -->
    <div class="grass back">
      <span class="blade" style="left: 4%;  height: 12px; animation-delay: 0.1s;"></span>
      <span class="blade" style="left: 9%;  height: 16px; animation-delay: 0.4s;"></span>
      <span class="blade" style="left: 14%; height: 11px; animation-delay: 0.7s;"></span>
      <span class="blade" style="left: 19%; height: 14px; animation-delay: 1.0s;"></span>
      <span class="blade" style="left: 24%; height: 10px; animation-delay: 1.3s;"></span>
      <span class="blade" style="left: 32%; height: 13px; animation-delay: 1.6s;"></span>
      <span class="blade" style="left: 38%; height: 11px; animation-delay: 1.9s;"></span>
      <span class="blade" style="left: 46%; height: 14px; animation-delay: 2.2s;"></span>
      <span class="blade" style="left: 54%; height: 12px; animation-delay: 2.5s;"></span>
      <span class="blade" style="left: 60%; height: 16px; animation-delay: 0.5s;"></span>
      <span class="blade" style="left: 66%; height: 10px; animation-delay: 0.8s;"></span>
      <span class="blade" style="left: 72%; height: 13px; animation-delay: 1.1s;"></span>
      <span class="blade" style="left: 78%; height: 15px; animation-delay: 1.4s;"></span>
      <span class="blade" style="left: 84%; height: 11px; animation-delay: 1.7s;"></span>
      <span class="blade" style="left: 91%; height: 14px; animation-delay: 2.0s;"></span>
      <span class="blade" style="left: 97%; height: 12px; animation-delay: 2.3s;"></span>
    </div>
    <!-- Grass blades (front layer, taller, brighter) -->
    <div class="grass front">
      <span class="blade" style="left: 6%;  height: 22px; animation-delay: 0.2s;"></span>
      <span class="blade" style="left: 12%; height: 18px; animation-delay: 0.5s;"></span>
      <span class="blade" style="left: 21%; height: 24px; animation-delay: 0.8s;"></span>
      <span class="blade" style="left: 29%; height: 20px; animation-delay: 1.1s;"></span>
      <span class="blade" style="left: 37%; height: 22px; animation-delay: 1.4s;"></span>
      <span class="blade" style="left: 49%; height: 18px; animation-delay: 1.7s;"></span>
      <span class="blade" style="left: 57%; height: 24px; animation-delay: 2.0s;"></span>
      <span class="blade" style="left: 65%; height: 20px; animation-delay: 2.3s;"></span>
      <span class="blade" style="left: 75%; height: 22px; animation-delay: 0.6s;"></span>
      <span class="blade" style="left: 87%; height: 19px; animation-delay: 0.9s;"></span>
      <span class="blade" style="left: 94%; height: 24px; animation-delay: 1.2s;"></span>
    </div>

    <!-- Flowers -->
    <div class="plant p1 pink short">
      <div class="stem-wrap"><div class="stem"></div></div>
      <div class="leaf l1"><div class="leaf-shape"></div></div>
      <div class="leaf l2"><div class="leaf-shape"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="0 0 120 120">
          <defs>
            <radialGradient id="pinkPetal" cx="50%" cy="35%">
              <stop offset="0%"  stop-color="#fbcfe8"/>
              <stop offset="55%" stop-color="#fb7185"/>
              <stop offset="100%" stop-color="#9f1239"/>
            </radialGradient>
            <radialGradient id="coreSun" cx="35%" cy="35%">
              <stop offset="0%"  stop-color="#fff7ed"/>
              <stop offset="40%" stop-color="#fcd34d"/>
              <stop offset="85%" stop-color="#d97706"/>
              <stop offset="100%" stop-color="#7c2d12"/>
            </radialGradient>
          </defs>
          <!-- back petals (offset for depth) -->
          <g transform="translate(60 60)">
            <g>
              <ellipse cx="0" cy="-32" rx="18" ry="32" fill="url(#pinkPetal)" opacity="0.85" transform="rotate(30)"/>
              <ellipse cx="0" cy="-32" rx="18" ry="32" fill="url(#pinkPetal)" opacity="0.85" transform="rotate(90)"/>
              <ellipse cx="0" cy="-32" rx="18" ry="32" fill="url(#pinkPetal)" opacity="0.85" transform="rotate(150)"/>
              <ellipse cx="0" cy="-32" rx="18" ry="32" fill="url(#pinkPetal)" opacity="0.85" transform="rotate(210)"/>
              <ellipse cx="0" cy="-32" rx="18" ry="32" fill="url(#pinkPetal)" opacity="0.85" transform="rotate(270)"/>
              <ellipse cx="0" cy="-32" rx="18" ry="32" fill="url(#pinkPetal)" opacity="0.85" transform="rotate(330)"/>
            </g>
            <!-- front petals -->
            <g>
              <ellipse cx="0" cy="-28" rx="15" ry="28" fill="url(#pinkPetal)"/>
              <ellipse cx="0" cy="-28" rx="15" ry="28" fill="url(#pinkPetal)" transform="rotate(60)"/>
              <ellipse cx="0" cy="-28" rx="15" ry="28" fill="url(#pinkPetal)" transform="rotate(120)"/>
              <ellipse cx="0" cy="-28" rx="15" ry="28" fill="url(#pinkPetal)" transform="rotate(180)"/>
              <ellipse cx="0" cy="-28" rx="15" ry="28" fill="url(#pinkPetal)" transform="rotate(240)"/>
              <ellipse cx="0" cy="-28" rx="15" ry="28" fill="url(#pinkPetal)" transform="rotate(300)"/>
            </g>
            <circle r="14" fill="url(#coreSun)"/>
            <circle r="4" cx="-4" cy="-4" fill="rgba(255,255,255,0.7)"/>
          </g>
        </svg>
      </div>
    </div>

    <div class="plant p2 violet tall">
      <div class="stem-wrap"><div class="stem"></div></div>
      <div class="leaf l1"><div class="leaf-shape"></div></div>
      <div class="leaf l2"><div class="leaf-shape"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="0 0 120 120">
          <defs>
            <radialGradient id="violetPetal" cx="50%" cy="35%">
              <stop offset="0%"  stop-color="#e9d5ff"/>
              <stop offset="55%" stop-color="#a855f7"/>
              <stop offset="100%" stop-color="#4c1d95"/>
            </radialGradient>
          </defs>
          <g transform="translate(60 60)">
            <g>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(22.5)"/>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(67.5)"/>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(112.5)"/>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(157.5)"/>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(202.5)"/>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(247.5)"/>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(292.5)"/>
              <ellipse cx="0" cy="-34" rx="14" ry="34" fill="url(#violetPetal)" opacity="0.85" transform="rotate(337.5)"/>
            </g>
            <g>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(0)"/>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(45)"/>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(90)"/>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(135)"/>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(180)"/>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(225)"/>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(270)"/>
              <ellipse cx="0" cy="-28" rx="12" ry="28" fill="url(#violetPetal)" transform="rotate(315)"/>
            </g>
            <circle r="14" fill="url(#coreSun)"/>
            <circle r="4" cx="-4" cy="-4" fill="rgba(255,255,255,0.7)"/>
          </g>
        </svg>
      </div>
    </div>

    <div class="plant p3 sun short">
      <div class="stem-wrap"><div class="stem"></div></div>
      <div class="leaf l1"><div class="leaf-shape"></div></div>
      <div class="leaf l2"><div class="leaf-shape"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="0 0 120 120">
          <defs>
            <radialGradient id="sunPetal" cx="50%" cy="40%">
              <stop offset="0%"  stop-color="#fef9c3"/>
              <stop offset="40%" stop-color="#fbbf24"/>
              <stop offset="100%" stop-color="#9a3412"/>
            </radialGradient>
          </defs>
          <g transform="translate(60 60)">
            <g>
              <path d="M0 -42 Q14 -28 0 -10 Q-14 -28 0 -42 Z" fill="url(#sunPetal)" opacity="0.85" transform="rotate(30)"/>
              <path d="M0 -42 Q14 -28 0 -10 Q-14 -28 0 -42 Z" fill="url(#sunPetal)" opacity="0.85" transform="rotate(90)"/>
              <path d="M0 -42 Q14 -28 0 -10 Q-14 -28 0 -42 Z" fill="url(#sunPetal)" opacity="0.85" transform="rotate(150)"/>
              <path d="M0 -42 Q14 -28 0 -10 Q-14 -28 0 -42 Z" fill="url(#sunPetal)" opacity="0.85" transform="rotate(210)"/>
              <path d="M0 -42 Q14 -28 0 -10 Q-14 -28 0 -42 Z" fill="url(#sunPetal)" opacity="0.85" transform="rotate(270)"/>
              <path d="M0 -42 Q14 -28 0 -10 Q-14 -28 0 -42 Z" fill="url(#sunPetal)" opacity="0.85" transform="rotate(330)"/>
            </g>
            <g>
              <path d="M0 -38 Q12 -24 0 -8 Q-12 -24 0 -38 Z" fill="url(#sunPetal)"/>
              <path d="M0 -38 Q12 -24 0 -8 Q-12 -24 0 -38 Z" fill="url(#sunPetal)" transform="rotate(60)"/>
              <path d="M0 -38 Q12 -24 0 -8 Q-12 -24 0 -38 Z" fill="url(#sunPetal)" transform="rotate(120)"/>
              <path d="M0 -38 Q12 -24 0 -8 Q-12 -24 0 -38 Z" fill="url(#sunPetal)" transform="rotate(180)"/>
              <path d="M0 -38 Q12 -24 0 -8 Q-12 -24 0 -38 Z" fill="url(#sunPetal)" transform="rotate(240)"/>
              <path d="M0 -38 Q12 -24 0 -8 Q-12 -24 0 -38 Z" fill="url(#sunPetal)" transform="rotate(300)"/>
            </g>
            <circle r="14" fill="url(#coreSun)"/>
            <circle r="4" cx="-4" cy="-4" fill="rgba(255,255,255,0.85)"/>
          </g>
        </svg>
      </div>
    </div>

    <div class="plant p4 sky tall">
      <div class="stem-wrap"><div class="stem"></div></div>
      <div class="leaf l1"><div class="leaf-shape"></div></div>
      <div class="leaf l2"><div class="leaf-shape"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="0 0 120 120">
          <defs>
            <radialGradient id="skyPetal" cx="50%" cy="35%">
              <stop offset="0%"  stop-color="#e0f2fe"/>
              <stop offset="55%" stop-color="#38bdf8"/>
              <stop offset="100%" stop-color="#1e3a8a"/>
            </radialGradient>
          </defs>
          <g transform="translate(60 60)">
            <g>
              <ellipse cx="0" cy="-34" rx="17" ry="34" fill="url(#skyPetal)" opacity="0.85" transform="rotate(36)"/>
              <ellipse cx="0" cy="-34" rx="17" ry="34" fill="url(#skyPetal)" opacity="0.85" transform="rotate(108)"/>
              <ellipse cx="0" cy="-34" rx="17" ry="34" fill="url(#skyPetal)" opacity="0.85" transform="rotate(180)"/>
              <ellipse cx="0" cy="-34" rx="17" ry="34" fill="url(#skyPetal)" opacity="0.85" transform="rotate(252)"/>
              <ellipse cx="0" cy="-34" rx="17" ry="34" fill="url(#skyPetal)" opacity="0.85" transform="rotate(324)"/>
            </g>
            <g>
              <ellipse cx="0" cy="-28" rx="14" ry="28" fill="url(#skyPetal)" transform="rotate(0)"/>
              <ellipse cx="0" cy="-28" rx="14" ry="28" fill="url(#skyPetal)" transform="rotate(72)"/>
              <ellipse cx="0" cy="-28" rx="14" ry="28" fill="url(#skyPetal)" transform="rotate(144)"/>
              <ellipse cx="0" cy="-28" rx="14" ry="28" fill="url(#skyPetal)" transform="rotate(216)"/>
              <ellipse cx="0" cy="-28" rx="14" ry="28" fill="url(#skyPetal)" transform="rotate(288)"/>
            </g>
            <circle r="13" fill="url(#coreSun)"/>
            <circle r="4" cx="-4" cy="-4" fill="rgba(255,255,255,0.75)"/>
          </g>
        </svg>
      </div>
    </div>

    <div class="plant p5 ruby short">
      <div class="stem-wrap"><div class="stem"></div></div>
      <div class="leaf l1"><div class="leaf-shape"></div></div>
      <div class="leaf l2"><div class="leaf-shape"></div></div>
      <div class="bloom">
        <div class="aura"></div>
        <svg viewBox="0 0 120 120">
          <defs>
            <radialGradient id="rubyPetal" cx="50%" cy="35%">
              <stop offset="0%"  stop-color="#fecaca"/>
              <stop offset="55%" stop-color="#ef4444"/>
              <stop offset="100%" stop-color="#7f1d1d"/>
            </radialGradient>
          </defs>
          <g transform="translate(60 60)">
            <g>
              <ellipse cx="0" cy="-32" rx="16" ry="32" fill="url(#rubyPetal)" opacity="0.85" transform="rotate(30)"/>
              <ellipse cx="0" cy="-32" rx="16" ry="32" fill="url(#rubyPetal)" opacity="0.85" transform="rotate(90)"/>
              <ellipse cx="0" cy="-32" rx="16" ry="32" fill="url(#rubyPetal)" opacity="0.85" transform="rotate(150)"/>
              <ellipse cx="0" cy="-32" rx="16" ry="32" fill="url(#rubyPetal)" opacity="0.85" transform="rotate(210)"/>
              <ellipse cx="0" cy="-32" rx="16" ry="32" fill="url(#rubyPetal)" opacity="0.85" transform="rotate(270)"/>
              <ellipse cx="0" cy="-32" rx="16" ry="32" fill="url(#rubyPetal)" opacity="0.85" transform="rotate(330)"/>
            </g>
            <g>
              <ellipse cx="0" cy="-26" rx="13" ry="26" fill="url(#rubyPetal)"/>
              <ellipse cx="0" cy="-26" rx="13" ry="26" fill="url(#rubyPetal)" transform="rotate(60)"/>
              <ellipse cx="0" cy="-26" rx="13" ry="26" fill="url(#rubyPetal)" transform="rotate(120)"/>
              <ellipse cx="0" cy="-26" rx="13" ry="26" fill="url(#rubyPetal)" transform="rotate(180)"/>
              <ellipse cx="0" cy="-26" rx="13" ry="26" fill="url(#rubyPetal)" transform="rotate(240)"/>
              <ellipse cx="0" cy="-26" rx="13" ry="26" fill="url(#rubyPetal)" transform="rotate(300)"/>
            </g>
            <circle r="13" fill="url(#coreSun)"/>
            <circle r="4" cx="-4" cy="-4" fill="rgba(255,255,255,0.75)"/>
          </g>
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

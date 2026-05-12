export const DEFAULT_PLAYGROUND_CODE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    background:
      radial-gradient(ellipse 70% 60% at 50% 35%, #312e81 0%, #0b1029 55%, #020617 100%);
    display: grid;
    place-items: center;
    overflow: hidden;
    font-family: system-ui, sans-serif;
    color: #fff;
  }

  .scene {
    position: relative;
    width: 320px;
    height: 320px;
  }

  /* Soft glowing world behind the flower */
  .world {
    position: absolute;
    inset: -40px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 55%, rgba(99,102,241,0.55) 0%, rgba(34,211,238,0.32) 35%, rgba(245,158,11,0.18) 60%, transparent 75%);
    filter: blur(28px);
    animation: world-pulse 7s ease-in-out infinite;
  }

  /* A second slimmer ring for depth */
  .halo {
    position: absolute;
    inset: 12%;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      inset 0 0 40px rgba(165,180,252,0.15),
      0 0 60px rgba(99,102,241,0.25);
  }

  @keyframes world-pulse {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.06); opacity: 1; }
  }

  /* The flower */
  .flower {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .petal {
    position: absolute;
    width: 86px;
    height: 140px;
    bottom: 50%;
    left: calc(50% - 43px);
    background:
      linear-gradient(180deg, #f472b6 0%, #fb7185 35%, #f97316 75%, #fcd34d 100%);
    border-radius: 50% 50% 40% 40% / 70% 70% 30% 30%;
    transform-origin: 50% 100%;
    filter: drop-shadow(0 0 16px rgba(251,113,133,0.55));
    opacity: 0;
    transform: rotate(var(--r, 0deg)) scale(0);
    animation: bloom 2.4s cubic-bezier(.18,.72,.22,1) forwards;
    animation-delay: var(--d, 0s);
  }

  @keyframes bloom {
    to { opacity: 1; transform: rotate(var(--r, 0deg)) scale(1); }
  }

  .center {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fde68a 0%, #f59e0b 60%, #b45309 100%);
    box-shadow:
      0 0 30px rgba(252,211,77,0.85),
      inset 0 0 12px rgba(120,53,15,0.45);
    animation: core-pulse 3.4s ease-in-out infinite;
    z-index: 2;
  }

  @keyframes core-pulse {
    0%, 100% { box-shadow: 0 0 25px rgba(252,211,77,0.7), inset 0 0 12px rgba(120,53,15,0.45); }
    50%      { box-shadow: 0 0 55px rgba(252,211,77,1.0), inset 0 0 12px rgba(120,53,15,0.45); }
  }

  /* Floating sparkles */
  .sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 10px #fff;
    opacity: 0;
    animation: drift 5s ease-in-out infinite;
  }

  @keyframes drift {
    0%   { transform: translateY(20px) scale(0.8); opacity: 0; }
    50%  { opacity: 1; }
    100% { transform: translateY(-80px) scale(1.2); opacity: 0; }
  }
</style>
</head>
<body>
  <div class="scene">
    <div class="world"></div>
    <div class="halo"></div>

    <div class="flower">
      <div class="petal" style="--r:   0deg; --d: 0.00s"></div>
      <div class="petal" style="--r:  60deg; --d: 0.10s"></div>
      <div class="petal" style="--r: 120deg; --d: 0.20s"></div>
      <div class="petal" style="--r: 180deg; --d: 0.30s"></div>
      <div class="petal" style="--r: 240deg; --d: 0.40s"></div>
      <div class="petal" style="--r: 300deg; --d: 0.50s"></div>
      <div class="center"></div>
    </div>

    <span class="sparkle" style="left: 20%; top: 70%; animation-delay: 0s;"></span>
    <span class="sparkle" style="left: 75%; top: 30%; animation-delay: 1.2s;"></span>
    <span class="sparkle" style="left: 30%; top: 25%; animation-delay: 2.4s;"></span>
    <span class="sparkle" style="left: 80%; top: 75%; animation-delay: 3.6s;"></span>
  </div>
</body>
</html>`;

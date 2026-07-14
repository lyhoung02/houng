"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  ci: number;
}

interface Packet {
  from: number;
  to: number;
  t: number;
  speed: number;
  ci: number;
}

const THEMES = {
  light: {
    palette: [
      { core: "2,132,199", glow: "rgba(2,132,199,.6)" },
      { core: "109,40,217", glow: "rgba(109,40,217,.6)" },
      { core: "13,148,136", glow: "rgba(13,148,136,.55)" },
      { core: "217,119,6", glow: "rgba(217,119,6,.5)" },
    ],
    accent: "2,132,199",
    lineAlpha: 0.42,
    coreAlpha: 0.85,
    haloAlpha: 0.2,
    shadowBlur: 10,
  },
  dark: {
    palette: [
      { core: "125,211,252", glow: "rgba(56,189,248,.45)" },
      { core: "196,181,253", glow: "rgba(167,139,250,.45)" },
      { core: "153,246,228", glow: "rgba(45,212,191,.4)" },
      { core: "253,230,138", glow: "rgba(251,191,36,.35)" },
    ],
    accent: "125,211,252",
    lineAlpha: 0.26,
    coreAlpha: 0.68,
    haloAlpha: 0.13,
    shadowBlur: 7,
  },
};
const MAX_DIST = 170;
const MOUSE_DIST = 220;
const MOUSE_PULL = 0.012;
const MAX_SPEED = 0.7;

export function NeuralCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolved } = useTheme();
  const themeRef = useRef(resolved);
  themeRef.current = resolved;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let raf: number;
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    let frame = 0;
    const mouse = { x: -9999, y: -9999, active: false, phase: 0 };

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouse.active = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      mouse.x = x;
      mouse.y = y;
    }

    function onMouseLeave() {
      mouse.active = false;
    }

    function size() {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas!.offsetWidth;
      const height = canvas!.offsetHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn(width, height);
    }

    function spawn(width: number, height: number) {
      const count = Math.max(32, Math.min(Math.floor((width * height) / 12000), 65));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r: Math.random() * 2.4 + 1.6,
        phase: Math.random() * Math.PI * 2,
        ci: Math.floor(Math.random() * 4),
      }));
      packets = [];
    }

    function loop() {
      frame++;
      const theme = THEMES[themeRef.current];
      const PALETTE = theme.palette;
      const width = canvas!.offsetWidth;
      const height = canvas!.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      for (const node of nodes) {
        if (mouse.active) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 1 && distance < MOUSE_DIST) {
            const pull = (1 - distance / MOUSE_DIST) * MOUSE_PULL;
            node.vx += (dx / distance) * pull;
            node.vy += (dy / distance) * pull;
            const speed = Math.hypot(node.vx, node.vy);
            if (speed > MAX_SPEED) {
              node.vx = (node.vx / speed) * MAX_SPEED;
              node.vy = (node.vy / speed) * MAX_SPEED;
            }
          }
        }

        node.x += node.vx;
        node.y += node.vy;
        node.phase += 0.016;
        if (node.x < 0) {
          node.x = 0;
          node.vx = Math.abs(node.vx);
        }
        if (node.x > width) {
          node.x = width;
          node.vx = -Math.abs(node.vx);
        }
        if (node.y < 0) {
          node.y = 0;
          node.vy = Math.abs(node.vy);
        }
        if (node.y > height) {
          node.y = height;
          node.vy = -Math.abs(node.vy);
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance < MAX_DIST) {
            const alpha = (1 - distance / MAX_DIST) * theme.lineAlpha;
            const gradient = ctx.createLinearGradient(
              nodes[i].x,
              nodes[i].y,
              nodes[j].x,
              nodes[j].y,
            );
            gradient.addColorStop(0, `rgba(${PALETTE[nodes[i].ci].core},${alpha})`);
            gradient.addColorStop(1, `rgba(${PALETTE[nodes[j].ci].core},${alpha})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.4 + alpha * 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      if (mouse.active) {
        mouse.phase += 0.05;
        for (const node of nodes) {
          const distance = Math.hypot(mouse.x - node.x, mouse.y - node.y);
          if (distance < MOUSE_DIST) {
            const alpha = (1 - distance / MOUSE_DIST) * (theme.lineAlpha + 0.14);
            const gradient = ctx.createLinearGradient(mouse.x, mouse.y, node.x, node.y);
            gradient.addColorStop(0, `rgba(${theme.accent},${alpha})`);
            gradient.addColorStop(1, `rgba(${PALETTE[node.ci].core},${alpha * 0.7})`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5 + alpha * 1.2;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        }

        const pulse = Math.sin(mouse.phase) * 0.3 + 0.9;
        const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 30 * pulse);
        halo.addColorStop(0, `rgba(${theme.accent},${theme.haloAlpha + 0.06})`);
        halo.addColorStop(1, `rgba(${theme.accent},0)`);
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 30 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = halo;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${theme.accent},${theme.coreAlpha + 0.1})`;
        ctx.shadowBlur = theme.shadowBlur + 4;
        ctx.shadowColor = PALETTE[0].glow;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (frame % 14 === 0 && packets.length < 28) {
        const from = Math.floor(Math.random() * nodes.length);
        const to = Math.floor(Math.random() * nodes.length);
        if (from !== to) {
          const distance = Math.hypot(nodes[from].x - nodes[to].x, nodes[from].y - nodes[to].y);
          if (distance < MAX_DIST) {
            packets.push({
              from,
              to,
              t: 0,
              speed: 0.013 + Math.random() * 0.017,
              ci: nodes[from].ci,
            });
          }
        }
      }

      packets = packets.filter((packet) => {
        packet.t += packet.speed;
        if (packet.t >= 1) return false;
        const from = nodes[packet.from];
        const to = nodes[packet.to];
        const x = from.x + (to.x - from.x) * packet.t;
        const y = from.y + (to.y - from.y) * packet.t;
        const fade = (1 - packet.t * 0.6) * theme.coreAlpha;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PALETTE[packet.ci].core},${fade})`;
        ctx.shadowBlur = theme.shadowBlur;
        ctx.shadowColor = PALETTE[packet.ci].glow;
        ctx.fill();
        ctx.shadowBlur = 0;
        return true;
      });

      for (const node of nodes) {
        const pulse = Math.sin(node.phase) * 0.3 + 0.7;
        const color = PALETTE[node.ci];
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.r * 6 * pulse);
        gradient.addColorStop(0, `rgba(${color.core},${theme.haloAlpha})`);
        gradient.addColorStop(1, `rgba(${color.core},0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.core},${theme.coreAlpha})`;
        ctx.shadowBlur = theme.shadowBlur;
        ctx.shadowColor = color.glow;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(loop);
    }

    size();
    loop();

    const resizeObserver = new ResizeObserver(size);
    resizeObserver.observe(canvas);
    window.addEventListener("mousemove", onMouseMove);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={ref} className={`h-full w-full ${className ?? ""}`} />;
}

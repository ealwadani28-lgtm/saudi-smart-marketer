/**
 * ════════════════════════════════════════════════════════════════
 *  MagicLampToggle — Justlator Technologies signature theme toggle
 * ════════════════════════════════════════════════════════════════
 *
 *  مكوّن مستقل بالكامل (component + styles + variants).
 *  للنسخ إلى أي منتج من عائلة Justlator:
 *    1) انسخ هذا الملف كما هو إلى src/components/portable/
 *    2) ثبّت التبعيات:  bun add gsap
 *    3) استورد واستخدم:  <MagicLampToggle variant="cyan" onToggle={...} />
 *
 *  Variants:
 *    - "gold"    → Justlator Tools           (ذهبي/كهرماني — افتراضي)
 *    - "cyan"    → JustSecure / حصين         (سماوي نيون)
 *    - "emerald" → JustSyncFlow              (أخضر زمردي)
 *    - "violet"  → منتجات قادمة                (بنفسجي)
 *
 *  Props:
 *    - variant?: لون اللمبة عند الإضاءة
 *    - theme:    "dark" | "light"  (الحالة الحالية — يُديرها التطبيق)
 *    - onToggle: () => void        (يُستدعى بعد سحب الحبل)
 *    - position?: "top-right" | "top-left"  (افتراضي top-right للـ RTL)
 *    - hideOnMobile?: boolean      (افتراضي true — يُخفى تحت 640px)
 *
 *  © Justlator Technologies — توقيع بصري موحّد لعائلة منتجاتنا
 * ════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable);
}

export type MagicLampVariant = "gold" | "cyan" | "emerald" | "violet";
export type MagicLampPosition = "top-right" | "top-left";

interface MagicLampToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
  variant?: MagicLampVariant;
  position?: MagicLampPosition;
  hideOnMobile?: boolean;
  hint?: string;
}

/* ---------- Variant palettes (oklch) ---------- */
const VARIANTS: Record<MagicLampVariant, { bulb: string; glow: string; filament: string }> = {
  gold:    { bulb: "oklch(0.96 0.13 90 / 0.5)",  glow: "oklch(0.95 0.18 85 / 0.55)",  filament: "oklch(0.78 0.20 80)"  },
  cyan:    { bulb: "oklch(0.92 0.12 220 / 0.5)", glow: "oklch(0.85 0.18 220 / 0.6)",  filament: "oklch(0.78 0.18 215)" },
  emerald: { bulb: "oklch(0.93 0.13 165 / 0.5)", glow: "oklch(0.85 0.18 160 / 0.55)", filament: "oklch(0.78 0.18 160)" },
  violet:  { bulb: "oklch(0.90 0.13 295 / 0.5)", glow: "oklch(0.82 0.20 295 / 0.6)",  filament: "oklch(0.75 0.20 295)" },
};

export function MagicLampToggle({
  theme,
  onToggle,
  variant = "gold",
  position = "top-right",
  hideOnMobile = true,
  hint = "اسحبني",
}: MagicLampToggleProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dummyLineRef = useRef<SVGLineElement>(null);
  const cordsRef = useRef<(SVGPathElement | null)[]>([]);
  const dummyGroupRef = useRef<SVGGElement>(null);
  const toggleFnRef = useRef(onToggle);

  useEffect(() => { toggleFnRef.current = onToggle; }, [onToggle]);

  useEffect(() => {
    if (!formRef.current || !handleRef.current || !dummyLineRef.current) return;

    const line = dummyLineRef.current;
    const cords = cordsRef.current.filter(Boolean) as SVGPathElement[];
    const dummyGroup = dummyGroupRef.current!;
    const ENDX = parseFloat(line.getAttribute("x2") || "98");
    const ENDY = parseFloat(line.getAttribute("y2") || "380");

    const proxy = document.createElement("div");
    gsap.set(proxy, { x: ENDX, y: ENDY });

    let startX = 0;
    let startY = 0;

    const playClick = () => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = 1800;
        g.gain.value = 0.05;
        o.connect(g).connect(ctx.destination);
        o.start();
        o.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
        o.stop(ctx.currentTime + 0.08);
      } catch { /* silent */ }
    };

    const swingSeq = [1, 2, 3, 4, 3, 2, 1];
    const FRAME_DUR = 0.07;

    const buildSwingTL = () => {
      const tl = gsap.timeline({
        paused: true,
        onStart: () => {
          gsap.set(dummyGroup, { display: "none" });
          gsap.set(handleRef.current, { display: "none" });
          cords.forEach((c) => gsap.set(c, { display: "none" }));
          playClick();
          toggleFnRef.current();
        },
        onComplete: () => {
          cords.forEach((c) => gsap.set(c, { display: "none" }));
          gsap.set(dummyGroup, { display: "block" });
          gsap.set(handleRef.current, { display: "block" });
          gsap.set(line, { attr: { x2: ENDX, y2: ENDY } });
          gsap.set(proxy, { x: ENDX, y: ENDY });
        },
      });
      swingSeq.forEach((idx, i) => {
        const cord = cords[idx];
        if (!cord) return;
        const prev = swingSeq[i - 1];
        tl.call(() => {
          if (prev !== undefined && cords[prev]) gsap.set(cords[prev], { display: "none" });
          gsap.set(cord, { display: "block" });
        }, undefined, i * FRAME_DUR);
      });
      tl.to({}, { duration: swingSeq.length * FRAME_DUR });
      return tl;
    };

    const drag = Draggable.create(proxy, {
      trigger: handleRef.current,
      type: "x,y",
      allowEventDefault: true,
      onPress(e) { startX = e.x; startY = e.y; },
      onDragStart() { document.documentElement.style.setProperty("cursor", "grabbing"); },
      onDrag(this: { startX: number; startY: number; x: number; y: number }) {
        const sceneEl = formRef.current?.querySelector(".mlt-scene") as SVGSVGElement | null;
        if (!sceneEl) return;
        const ratio = 134 / sceneEl.getBoundingClientRect().width;
        line.setAttribute("x2", String(this.startX + (this.x - this.startX) * ratio));
        line.setAttribute("y2", String(this.startY + (this.y - this.startY) * ratio));
      },
      onRelease(e) {
        const dx = e.x - startX;
        const dy = e.y - startY;
        const travelled = Math.sqrt(dx * dx + dy * dy);
        document.documentElement.style.setProperty("cursor", "unset");
        gsap.to(line, {
          attr: { x2: ENDX, y2: ENDY },
          duration: 0.18,
          ease: "elastic.out(1, 0.55)",
          onComplete: () => {
            if (travelled > 40) buildSwingTL().play();
            else gsap.set(proxy, { x: ENDX, y: ENDY });
          },
        });
      },
    });

    return () => { drag.forEach((d) => d.kill()); };
  }, []);

  const isLight = theme === "light";
  const v = VARIANTS[variant];
  const posStyle: React.CSSProperties = position === "top-left"
    ? { top: "1rem", insetInlineStart: "1rem" }
    : { top: "1rem", insetInlineEnd: "1rem" };

  return (
    <>
      <style>{`
        .mlt[data-variant="${variant}"] {
          --mlt-bulb-on: ${v.bulb};
          --mlt-glow: ${v.glow};
          --mlt-filament-on: ${v.filament};
        }
      `}</style>
      <style>{MLT_STYLES}</style>

      <form
        ref={formRef}
        onSubmit={(e) => { e.preventDefault(); onToggle(); }}
        className={`mlt ${hideOnMobile ? "mlt--hide-mobile" : ""}`}
        data-variant={variant}
        data-theme={theme}
        style={posStyle}
        aria-label="مفتاح الإضاءة — تبديل المظهر"
      >
        <button
          type="submit"
          aria-pressed={isLight}
          aria-label={isLight ? "إطفاء الإضاءة (الوضع الليلي)" : "تشغيل الإضاءة (الوضع النهاري)"}
          className="mlt__btn"
        >
          <span className="mlt__sr">تبديل المظهر</span>
          <svg aria-hidden="true" className="mlt-scene" xmlns="http://www.w3.org/2000/svg" viewBox="32 32 134 134">
            <defs>
              {(["a","b","c","d","e"] as const).map((id) => (
                <marker key={id} id={`mlt-${variant}-${id}`} orient="auto" overflow="visible" refX="0" refY="0">
                  <path className="mlt-cord-end" fillRule="evenodd" strokeWidth=".2666" d="M.98 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </marker>
              ))}
            </defs>
            <g className="mlt-cords">
              <path ref={(el) => { cordsRef.current[0] = el; }} className="mlt-cord" markerEnd={`url(#mlt-${variant}-a)`} fill="none" strokeLinecap="square" strokeWidth="6" d="M123.228-28.56v150.493" transform="translate(-24.503 256.106)" />
              <path ref={(el) => { cordsRef.current[1] = el; }} className="mlt-cord" markerEnd={`url(#mlt-${variant}-a)`} fill="none" strokeLinecap="square" strokeWidth="6" d="M123.228-28.59s28 8.131 28 19.506-18.667 13.005-28 19.507c-9.333 6.502-28 8.131-28 19.506s28 19.507 28 19.507" transform="translate(-24.503 256.106)" />
              <path ref={(el) => { cordsRef.current[2] = el; }} className="mlt-cord" markerEnd={`url(#mlt-${variant}-a)`} fill="none" strokeLinecap="square" strokeWidth="6" d="M123.228-28.575s-20 16.871-20 28.468c0 11.597 13.333 18.978 20 28.468 6.667 9.489 20 16.87 20 28.467 0 11.597-20 28.468-20 28.468" transform="translate(-24.503 256.106)" />
              <path ref={(el) => { cordsRef.current[3] = el; }} className="mlt-cord" markerEnd={`url(#mlt-${variant}-a)`} fill="none" strokeLinecap="square" strokeWidth="6" d="M123.228-28.569s16 20.623 16 32.782c0 12.16-10.667 21.855-16 32.782-5.333 10.928-16 20.623-16 32.782 0 12.16 16 32.782 16 32.782" transform="translate(-24.503 256.106)" />
              <path ref={(el) => { cordsRef.current[4] = el; }} className="mlt-cord" markerEnd={`url(#mlt-${variant}-a)`} fill="none" strokeLinecap="square" strokeWidth="6" d="M123.228-28.563s-10 24.647-10 37.623c0 12.977 6.667 25.082 10 37.623 3.333 12.541 10 24.647 10 37.623 0 12.977-10 37.623-10 37.623" transform="translate(-24.503 256.106)" />
              <g ref={dummyGroupRef} className="line mlt-dummy-cord">
                <line ref={dummyLineRef} markerEnd={`url(#mlt-${variant}-a)`} x1="98" x2="98" y1="240" y2="380" />
              </g>
            </g>
            <g className="mlt-bulb" transform="translate(844.069 -645.213)">
              <path className="mlt-bulb__cap" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.677" d="M-774.546 827.629s12.917-13.473 29.203-13.412c16.53.062 29.203 13.412 29.203 13.412v53.6s-8.825 16-29.203 16c-21.674 0-29.203-16-29.203-16z" />
              <path className="mlt-bulb__cap" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M-774.546 827.629s12.917-13.473 29.203-13.412c16.53.062 29.203 13.412 29.203 13.412v0s-8.439 10.115-28.817 10.115c-21.673 0-29.59-10.115-29.59-10.115z" />
              <path className="mlt-bulb__cap-outline" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.677" d="M-774.546 827.629s12.917-13.473 29.203-13.412c16.53.062 29.203 13.412 29.203 13.412v53.6s-8.825 16-29.203 16c-21.674 0-29.203-16-29.203-16z" />
              <g className="mlt-bulb__filament" fill="none" strokeLinecap="round" strokeWidth="5">
                <path d="M-752.914 823.875l-8.858-33.06" />
                <path d="M-737.772 823.875l8.858-33.06" />
              </g>
              <path className="mlt-bulb__glass" strokeLinecap="round" strokeWidth="5" d="M-783.192 803.855c5.251 8.815 5.295 21.32 13.272 27.774 12.299 8.045 36.46 8.115 49.127 0 7.976-6.454 8.022-18.96 13.273-27.774 3.992-6.7 14.408-19.811 14.408-19.811 8.276-11.539 12.769-24.594 12.769-38.699 0-35.898-29.102-65-65-65-35.899 0-65 29.102-65 65 0 13.667 4.217 26.348 12.405 38.2 0 0 10.754 13.61 14.746 20.31z" />
              <path className="mlt-bulb__shine" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M-789.19 757.501a45.897 45.897 0 013.915-36.189 45.897 45.897 0 0129.031-21.957" />
            </g>
          </svg>
          <div ref={handleRef} className="mlt__handle" aria-hidden="true" />
        </button>
        <span className="mlt__hint" aria-hidden="true">
          <svg viewBox="0 0 12 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 17V3" /><path d="M1 8l5-5 5 5" />
          </svg>
          {hint}
        </span>
      </form>
    </>
  );
}

/* ---------- Self-contained CSS (injected once via <style>) ---------- */
const MLT_STYLES = `
.mlt {
  --mlt-cord: oklch(0.55 0.02 200);
  --mlt-stroke: oklch(0.65 0.02 200);
  --mlt-shine: oklch(0.92 0.02 200 / 0.7);
  --mlt-cap: oklch(0.42 0.02 200);
  --mlt-filament: oklch(0.5 0.02 200);
  --mlt-bulb: transparent;
  position: fixed; width: 48px; height: 48px; z-index: 100; margin: 0; pointer-events: none;
}
.mlt[data-theme='light'] {
  --mlt-cord: oklch(0.38 0.02 200);
  --mlt-stroke: oklch(0.3 0.02 200);
  --mlt-shine: oklch(1 0 0 / 0.75);
  --mlt-cap: oklch(0.28 0.02 200);
  --mlt-filament: var(--mlt-filament-on);
  --mlt-bulb: var(--mlt-bulb-on);
}
.mlt--hide-mobile { display: block; }
@media (max-width: 640px) { .mlt--hide-mobile { display: none; } }

.mlt__btn { width:100%; height:100%; background:transparent; border:0; padding:0; margin:0;
  position:absolute; inset:0; display:grid; place-items:center; cursor:pointer; pointer-events:auto; }
.mlt__btn:focus, .mlt__btn:focus-visible { outline:none; box-shadow:none; }
.mlt__sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }

.mlt__hint { position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:6px;
  display:flex; flex-direction:column; align-items:center; gap:2px; font-size:11px; font-weight:600;
  letter-spacing:0.04em; color:oklch(0.75 0.05 200 / 0.9); white-space:nowrap; pointer-events:none;
  user-select:none; animation: mlt-hint-pulse 1.8s ease-in-out infinite; }
.mlt__hint svg { width:12px; height:18px; }
@keyframes mlt-hint-pulse {
  0%,100% { opacity:0.55; transform:translate(-50%,0); }
  50% { opacity:1; transform:translate(-50%,3px); }
}

.mlt-scene { overflow:visible !important; position:absolute; width:65%; top:50%; left:50%;
  translate:-50% -50%; filter: drop-shadow(0 4px 14px oklch(0 0 0 / 0.3)); transition: filter 0.5s ease; }
.mlt[data-theme='light'] .mlt-scene {
  filter: drop-shadow(0 8px 28px var(--mlt-glow)) drop-shadow(0 0 18px var(--mlt-glow));
}

.mlt-cord { stroke: var(--mlt-cord); stroke-width:6; cursor:move; display:none; }
.mlt-cord-end { stroke: var(--mlt-cord); fill: var(--mlt-cord); }
.mlt-dummy-cord { stroke: var(--mlt-cord); stroke-width:6; cursor:grab; }
.mlt-dummy-cord:active { cursor:grabbing; }

.mlt-bulb__glass { stroke: var(--mlt-stroke); fill: var(--mlt-bulb); stroke-width:5; transition: fill 0.5s ease; }
.mlt-bulb__cap { fill: var(--mlt-cap); }
.mlt-bulb__cap-outline { stroke: var(--mlt-stroke); stroke-width:4.677; }
.mlt-bulb__shine { stroke: var(--mlt-shine); }
.mlt-bulb__filament { stroke: var(--mlt-filament); stroke-width:6; transition: stroke 0.4s ease, stroke-width 0.4s ease; }
.mlt[data-theme='light'] .mlt-bulb__filament { stroke-width:9; filter: drop-shadow(0 0 6px var(--mlt-filament-on)); }

.mlt__handle { width:48px; aspect-ratio:1; border-radius:50%; position:absolute;
  top: calc((48px * (0.35 / 2)) + ((48px * 0.65) * (125 / 48)));
  left:50%; translate:-50% -50%; z-index:999; cursor:grab; pointer-events:auto; }
`;

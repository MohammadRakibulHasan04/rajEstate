import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, Compass, Hammer, CheckCircle2, ChevronRight, Eye, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PhaseData {
  id: number;
  label: string;
  subtitle: string;
  code: string;
  milestone: string;
  specs: { label: string; value: string }[];
  description: string;
}

const PHASES: PhaseData[] = [
  {
    id: 1,
    label: 'Architectural Blueprint & CAD',
    subtitle: 'Schematic Structural Drafting & Geotechnical Survey',
    code: 'STAGE 01 // SCHEMATIC',
    milestone: 'Precision Elevation & Structural Calculations',
    specs: [
      { label: 'Datum Level', value: '+142.50m AMSL' },
      { label: 'Unpropped Cantilever', value: '38.4m Max Span' },
      { label: 'Seismic Base Isolation', value: 'Category IV High-Zone' },
      { label: 'Drafting Scale', value: '1:50 Orthographic' },
    ],
    description: 'Precision CAD elevation schematics and geotechnical core soil sampling define the foundation footings anchored directly into coastal bedrock.',
  },
  {
    id: 2,
    label: 'Structural Frame & Armature',
    subtitle: 'Post-Tensioned Concrete & Structural Steel Core',
    code: 'STAGE 02 // SUBSTRUCTURE',
    milestone: 'Erection of Shear Walls & Cantilevered Trusses',
    specs: [
      { label: 'Compressive Strength', value: '85 MPa Self-Consolidating' },
      { label: 'Steel Tendons', value: 'Grade 270 Low-Relaxation' },
      { label: 'Core Columns', value: '4x Quad-Box Sections' },
      { label: 'Deflection Target', value: '< 6.2mm at Peak Tip' },
    ],
    description: 'Sculptural post-tensioned concrete floor plates and high-tensile steel trusses rise, establishing the gravity-defying horizontal cantilever profile.',
  },
  {
    id: 3,
    label: 'Enclosure & Material Cladding',
    subtitle: 'Acoustic Glass Curtain & Travertine Slabs',
    code: 'STAGE 03 // FACADE',
    milestone: 'Installation of Low-Iron Glazing & Roman Stone',
    specs: [
      { label: 'Acoustic Rating', value: 'STC 48 Decibels' },
      { label: 'Solar Heat Gain', value: 'SHGC 0.22 Solar-Shield' },
      { label: 'Exterior Cladding', value: 'Roman Vein-Cut Travertine' },
      { label: 'Thermal Envelope', value: 'Passivhaus Standard' },
    ],
    description: 'Triple-pane panoramic low-iron motorized sliding curtain walls lock into thermal breaks, flanked by quarried vein-cut travertine stone facades.',
  },
  {
    id: 4,
    label: 'Living Architectural Reality',
    subtitle: 'Bespoke Twilight Illumination & Finished Existence',
    code: 'STAGE 04 // REALITY',
    milestone: 'Commissioned Residence & Reflecting Basin',
    specs: [
      { label: 'Lighting Architecture', value: '2700K DALI-2 Warm Cove' },
      { label: 'Water Feature', value: 'Zero-Edge Reflection Channel' },
      { label: 'Interior Volume', value: '18ft Double-Height Salon' },
      { label: 'Net Energy Status', value: 'LEED Platinum Certified' },
    ],
    description: 'The architectural narrative completes: warm dusk lights illuminate the travertine salon, casting glowing reflections across the tranquil infinity basin.',
  },
];

export const ArchitecturalGenesisNarrative: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: '+=2000',
        pin: true,
        scrub: 0.8,
        onUpdate: (self) => {
          const prog = self.progress;
          setScrollProgress(prog);
          const index = Math.min(3, Math.floor(prog * 4));
          setActivePhaseIndex(index);
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.015;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const p = scrollProgress;

      const blueprintAlpha = Math.max(0, 1 - p * 2.2);
      const frameAlpha = Math.min(1, Math.max(0, p > 0.15 ? (p < 0.65 ? 1 : 1 - (p - 0.65) * 2.8) : (p - 0.05) * 5));
      const facadeAlpha = Math.min(1, Math.max(0, p > 0.45 ? (p < 0.9 ? 1 : 1 - (p - 0.45) * 4) : (p - 0.45) * 4));
      const realityAlpha = Math.min(1, Math.max(0, (p - 0.65) * 3));

      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (realityAlpha > 0.05) {
        skyGrad.addColorStop(0, '#070a12');
        skyGrad.addColorStop(0.5, '#121726');
        skyGrad.addColorStop(0.85, `rgba(62, 38, 48, ${realityAlpha})`);
        skyGrad.addColorStop(1, `rgba(22, 17, 24, ${realityAlpha})`);
      } else {
        skyGrad.addColorStop(0, '#050c18');
        skyGrad.addColorStop(0.7, '#071529');
        skyGrad.addColorStop(1, '#030812');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      if (blueprintAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = blueprintAlpha * 0.45;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.5;

        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#7dd3fc';
        ctx.font = '10px monospace';
        ctx.fillText('REF 00-DATUM // +0.000', 40, height - 80);
        ctx.fillText('SPAN 38.40M // POST-TENSION CORE', width / 2 - 100, 50);
        ctx.restore();
      }

      if (p > 0.2) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.7, (p - 0.2) * 1.5);
        ctx.fillStyle = realityAlpha > 0.5 ? '#0c101a' : '#07101f';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.62);
        ctx.lineTo(width * 0.15, height * 0.52);
        ctx.lineTo(width * 0.35, height * 0.58);
        ctx.lineTo(width * 0.55, height * 0.48);
        ctx.lineTo(width * 0.75, height * 0.55);
        ctx.lineTo(width * 0.9, height * 0.46);
        ctx.lineTo(width, height * 0.54);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const groundY = height * 0.7;
      ctx.save();
      ctx.fillStyle = realityAlpha > 0.4 ? '#10141d' : '#0a1628';
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.strokeStyle = blueprintAlpha > 0.2 ? '#0284c7' : '#222d3d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();
      ctx.restore();

      const bX = width * 0.2;
      const bW = width * 0.6;
      const l1H = height * 0.22;
      const l1Y = groundY - l1H;
      const l2H = height * 0.18;
      const l2Y = l1Y - l2H;
      const cantW = width * 0.68;
      const cantX = width * 0.14;

      if (blueprintAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = blueprintAlpha;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;

        ctx.strokeRect(bX, l1Y, bW, l1H);
        ctx.strokeRect(cantX, l2Y, cantW, l2H);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        for (let i = 0; i < bW; i += 30) {
          ctx.beginPath();
          ctx.moveTo(bX + i, l1Y);
          ctx.lineTo(bX + i, groundY);
          ctx.stroke();
        }

        ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2.5;
        [bX + 80, bX + bW * 0.4, bX + bW * 0.75, bX + bW - 40].forEach((colX) => {
          ctx.beginPath();
          ctx.moveTo(colX, l2Y);
          ctx.lineTo(colX, groundY + 40);
          ctx.stroke();
        });

        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cantX, l2Y - 20);
        ctx.lineTo(cantX + cantW, l2Y - 20);
        ctx.moveTo(cantX, l2Y - 28);
        ctx.lineTo(cantX, l2Y - 12);
        ctx.moveTo(cantX + cantW, l2Y - 28);
        ctx.lineTo(cantX + cantW, l2Y - 12);
        ctx.stroke();

        ctx.fillStyle = '#bae6fd';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('38,400 mm OVERALL RESIDENTIAL SPAN', cantX + cantW / 2, l2Y - 26);
        ctx.restore();
      }

      if (frameAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = frameAlpha;

        ctx.fillStyle = '#222834';
        ctx.strokeStyle = '#3d485c';
        ctx.lineWidth = 1.5;

        ctx.fillRect(bX + bW * 0.55, l2Y, 70, l1H + l2H);
        ctx.strokeRect(bX + bW * 0.55, l2Y, 70, l1H + l2H);

        ctx.fillStyle = '#2b3342';
        ctx.fillRect(cantX, l2Y, cantW, 14);
        ctx.fillRect(cantX, l1Y, cantW, 18);
        ctx.fillRect(bX - 40, groundY - 12, bW + 80, 24);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.globalAlpha = frameAlpha * 0.75;
        const trussStartX = cantX;
        const trussEndX = bX + 60;
        ctx.beginPath();
        ctx.moveTo(trussStartX, l1Y);
        ctx.lineTo(trussStartX + 60, l2Y + 14);
        ctx.lineTo(trussStartX + 120, l1Y);
        ctx.lineTo(trussStartX + 180, l2Y + 14);
        ctx.lineTo(trussEndX, l1Y);
        ctx.stroke();

        ctx.fillStyle = '#343e50';
        [bX + 40, bX + bW * 0.25, bX + bW * 0.85].forEach((cx) => {
          ctx.fillRect(cx, l1Y + 18, 22, l1H - 18);
        });

        const laserY = l2Y + ((Math.sin(t * 3) + 1) / 2) * (l1H + l2H);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cantX - 20, laserY);
        ctx.lineTo(cantX + cantW + 20, laserY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (facadeAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = facadeAlpha;

        const travX = bX + bW * 0.65;
        const travW = bW * 0.35;
        ctx.fillStyle = '#322d26';
        ctx.fillRect(travX, l2Y + 14, travW, l1H + l2H - 14);
        ctx.strokeStyle = '#473f35';
        ctx.lineWidth = 1;

        for (let j = l2Y + 35; j < groundY; j += 24) {
          ctx.beginPath();
          ctx.moveTo(travX, j);
          ctx.lineTo(travX + travW, j);
          ctx.stroke();
        }

        const glassX = cantX + 20;
        const glassW = travX - glassX - 10;
        const glassGrad = ctx.createLinearGradient(0, l2Y, 0, groundY);
        glassGrad.addColorStop(0, 'rgba(30, 48, 70, 0.85)');
        glassGrad.addColorStop(0.5, 'rgba(18, 30, 46, 0.9)');
        glassGrad.addColorStop(1, 'rgba(10, 18, 30, 0.95)');
        ctx.fillStyle = glassGrad;

        ctx.fillRect(glassX, l2Y + 14, glassW + 30, l2H - 14);
        ctx.fillRect(bX + 10, l1Y + 18, glassW - (bX - glassX) + 20, l1H - 18);

        ctx.strokeStyle = '#1e2633';
        ctx.lineWidth = 2.5;
        for (let m = glassX + 60; m < travX; m += 75) {
          ctx.beginPath();
          ctx.moveTo(m, l2Y + 14);
          ctx.lineTo(m, groundY);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (realityAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = realityAlpha;

        const travX = bX + bW * 0.65;
        const glassX = cantX + 20;
        const glassW = travX - glassX;

        const interiorGrad1 = ctx.createRadialGradient(
          glassX + glassW * 0.4,
          l1Y + l1H * 0.5,
          10,
          glassX + glassW * 0.4,
          l1Y + l1H * 0.5,
          glassW * 0.6
        );
        interiorGrad1.addColorStop(0, 'rgba(254, 215, 170, 0.85)');
        interiorGrad1.addColorStop(0.4, 'rgba(249, 115, 22, 0.45)');
        interiorGrad1.addColorStop(1, 'rgba(124, 45, 18, 0.05)');
        ctx.fillStyle = interiorGrad1;
        ctx.fillRect(bX + 10, l1Y + 18, glassW - (bX - glassX), l1H - 18);

        const interiorGrad2 = ctx.createRadialGradient(
          glassX + glassW * 0.6,
          l2Y + l2H * 0.5,
          10,
          glassX + glassW * 0.6,
          l2Y + l2H * 0.5,
          glassW * 0.5
        );
        interiorGrad2.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
        interiorGrad2.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
        interiorGrad2.addColorStop(1, 'rgba(30, 20, 10, 0.05)');
        ctx.fillStyle = interiorGrad2;
        ctx.fillRect(glassX, l2Y + 14, glassW + 30, l2H - 14);

        ctx.fillStyle = '#171922';
        ctx.fillRect(bX + 80, groundY - 32, 140, 20);
        ctx.fillRect(bX + 240, groundY - 26, 70, 14);

        const poolX = cantX - 30;
        const poolW = cantW + 60;
        const poolY = groundY + 16;
        const poolH = height - poolY - 20;

        const poolGrad = ctx.createLinearGradient(0, poolY, 0, height);
        poolGrad.addColorStop(0, '#091d2c');
        poolGrad.addColorStop(0.4, '#0e2f42');
        poolGrad.addColorStop(1, '#051119');
        ctx.fillStyle = poolGrad;
        ctx.fillRect(poolX, poolY, poolW, poolH);

        ctx.strokeStyle = '#223244';
        ctx.lineWidth = 3;
        ctx.strokeRect(poolX, poolY, poolW, poolH);

        ctx.save();
        for (let r = 0; r < 8; r++) {
          const ripY = poolY + 15 + r * 14;
          const offset = Math.sin(t * 1.5 + r) * 12;
          ctx.strokeStyle = r % 2 === 0 ? 'rgba(251, 146, 60, 0.25)' : 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(poolX + 80 + offset, ripY);
          ctx.lineTo(poolX + poolW - 120 + offset, ripY);
          ctx.stroke();
        }
        ctx.restore();

        [bX + 30, bX + bW * 0.3, bX + bW * 0.6, bX + bW - 20].forEach((lx) => {
          const lightGrad = ctx.createRadialGradient(lx, groundY, 2, lx, groundY - 60, 60);
          lightGrad.addColorStop(0, 'rgba(253, 224, 71, 0.7)');
          lightGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.moveTo(lx - 12, groundY);
          ctx.lineTo(lx, groundY - 70);
          ctx.lineTo(lx + 12, groundY);
          ctx.closePath();
          ctx.fill();
        });

        ctx.fillStyle = '#0f141f';
        ctx.beginPath();
        const treeX = bX + bW + 40;
        const treeY = groundY;
        ctx.moveTo(treeX, treeY);
        ctx.quadraticCurveTo(treeX + 15, treeY - 80, treeX - 20, treeY - 140);
        ctx.quadraticCurveTo(treeX + 40, treeY - 180, treeX + 60, treeY - 130);
        ctx.quadraticCurveTo(treeX + 90, treeY - 90, treeX + 25, treeY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [scrollProgress]);

  const activePhase = PHASES[activePhaseIndex];

  const handleJumpToPhase = (phaseIdx: number) => {
    setActivePhaseIndex(phaseIdx);
    setScrollProgress(phaseIdx / 3);
  };

  return (
    <section ref={containerRef} className="relative h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="absolute top-6 left-8 right-8 z-10 flex flex-col md:flex-row md:items-center justify-between pointer-events-none gap-4">
        <div>
          <div className="flex items-center gap-3 text-xs font-mono text-cyan-400 tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>ARCHITECTURAL METAMORPHOSIS ENGINE</span>
            <span className="text-slate-500">·</span>
            <span>GSAP SCROLL PARALLAX</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-medium text-white tracking-tight mt-1">
            Blueprint to Living Existence
          </h2>
        </div>

        <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-lg px-4 py-2.5 shadow-xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Metamorphosis Progress</span>
            <span className="text-base font-mono font-semibold text-cyan-400 tabular-nums">
              {(scrollProgress * 100).toFixed(0)}% REALIZED
            </span>
          </div>
          <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 transition-all duration-150"
              style={{ width: `${Math.max(5, scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-20 max-w-xl w-full">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl mb-3 shadow-2xl">
          {PHASES.map((phase, idx) => (
            <button
              key={phase.id}
              onClick={() => handleJumpToPhase(idx)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activePhaseIndex === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="font-mono text-[10px] opacity-70">0{phase.id}</span>
              <span className="hidden sm:inline truncate">{phase.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-mono text-cyan-400">{activePhase.code}</span>
            <span>{activePhase.milestone}</span>
          </div>
          <h3 className="text-lg font-display font-medium text-white mb-1.5">
            {activePhase.label}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {activePhase.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800">
            {activePhase.specs.map((spec, sIdx) => (
              <div key={sIdx} className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400">{spec.label}</span>
                <span className="text-xs font-mono font-medium text-slate-200 mt-0.5">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-20 hidden lg:flex flex-col gap-3 w-80">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DYNAMIC DISCIPLINE CALLOUT</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activePhaseIndex === 0 && 'Cadastral vectors establish 38m structural cantilever clearance above limestone bluff.'}
            {activePhaseIndex === 1 && 'Post-tensioned core withstands 140mph coastal wind shear and seismic lateral loads.'}
            {activePhaseIndex === 2 && 'Custom triple-glazed low-iron panels eliminate condensation while blocking 99.8% UV.'}
            {activePhaseIndex === 3 && 'Lutron DALI-2 automated circadian fixtures simulate natural sun angles across travertine walls.'}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>SCROLL DOWN TO PROGRESS</span>
            <span className="text-cyan-400">STAGE {activePhaseIndex + 1} OF 4</span>
          </div>
        </div>
      </div>
    </section>
  );
};

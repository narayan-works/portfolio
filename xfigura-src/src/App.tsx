import { useState, useEffect } from 'react';
import { CanvasProvider, useCanvas } from './context/CanvasContext';
import { Canvas } from './components/Canvas/Canvas';
import { SidebarControls } from './components/Canvas/SidebarControls';
import { ChevronDown, Maximize2, X } from 'lucide-react';

function App() {
  return (
    <CanvasProvider>
      <AppContent />
    </CanvasProvider>
  );
}

function AppContent() {
  const [activeFocus] = useState('OP-1');
  const [highlightedIco, setHighlightedIco] = useState<string | null>(null);
  const [isCanvasEnlarged, setIsCanvasEnlarged] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { setZoom, setPan, nodes, selectedNodeId } = useCanvas();

  useEffect(() => {
    if (isCanvasEnlarged) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCanvasEnlarged]);

  // Detect if the app is embedded inside an iframe
  const isEmbed = typeof window !== 'undefined' && (window.self !== window.top || window.location.search.includes('embed'));

  // Auto-enlarge and pan if in embed mode
  useEffect(() => {
    if (isEmbed) {
      setZoom(0.8);
      const activeNode = nodes.find(n => n.id === 'node-generator') || nodes[0];
      if (activeNode) {
        setPan({
          x: window.innerWidth / 2 - (activeNode.x + 196) * 0.8,
          y: window.innerHeight / 2 - (activeNode.y + 200) * 0.8,
        });
      }
    }
  }, [isEmbed, nodes]);

  const toggleEnlarge = (shouldEnlarge: boolean) => {
    setIsCanvasEnlarged(shouldEnlarge);
    const targetZoom = shouldEnlarge ? 0.96 : 0.76;
    setZoom(targetZoom);

    const activeNode = nodes.find(n => n.id === 'node-generator' || n.id.startsWith('node-generated') || n.id === selectedNodeId)
      || nodes[0];

    if (activeNode) {
      const containerWidth = shouldEnlarge ? window.innerWidth : Math.min(1192, window.innerWidth - 48);
      const containerHeight = shouldEnlarge ? window.innerHeight : 600;

      setPan({
        x: containerWidth / 2 - (activeNode.x + 196) * targetZoom,
        y: containerHeight / 2 - (activeNode.y + 200) * targetZoom,
      });
    }
  };

  // Helper to generate correct class names for active opportunities
  const getOppClass = (id: string) => {
    return `opp rounded-[24px] border p-7 min-h-[640px] transition-all duration-300 flex flex-col justify-between ${id === 'OP-1'
      ? 'active border-[#22c55e]/90 bg-[#0a1f12]/65 text-zinc-100 shadow-[0_0_30px_rgba(34,197,94,0.14)] scale-[1.01]'
      : 'border-zinc-800/85 bg-zinc-950/20 text-zinc-500 cursor-default'
      }`;
  };

  if (isEmbed) {
    return (
      <div className="fixed inset-0 z-50 h-full w-full bg-zinc-950 overflow-hidden">
        <Canvas />
        <SidebarControls />
      </div>
    );
  }

  return (
    <div className="font-sans text-zinc-100 antialiased min-h-screen bg-[#09090b]">
      {/* Viewport-level Fullscreen Canvas Overlay */}
      {isCanvasEnlarged && (
        <div className="fixed inset-0 z-50 h-screen w-screen bg-zinc-950 overflow-hidden">
          {/* Main interactive canvas area */}
          <Canvas />

          {/* Custom floating toolbars matching mockup */}
          <SidebarControls />

          {/* Enlarge/Minimize Button */}
          <button
            onClick={() => toggleEnlarge(false)}
            className="absolute top-6 right-6 z-40 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-zinc-350 hover:bg-zinc-900 hover:text-zinc-100 transition-all shadow-lg backdrop-blur-sm group cursor-pointer"
            title="Minimize Canvas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-95">
              <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
            </svg>
            <span>Collapse</span>
          </button>
        </div>
      )}

      <div className="gridbg">
        {/* ============ TOP BAR ============ */}
        {!isCanvasEnlarged && (
          <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-[#2b00ff] px-6 py-4 sm:px-8 shadow-lg border-b border-white/10">
            <div className="flex items-center gap-4">
              <img src="/full logo.png" alt="xFigura" className="h-7 w-auto rounded-[4px]" />
              <span className="text-white font-mono text-[11px] tracking-[0.18em] uppercase font-bold border-l border-white/20 pl-4 select-none">
                Product Architecture | NARAYAN ASHANAHALLI
              </span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('interactive-canvas-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white text-[#2b00ff] hover:bg-zinc-100 hover:text-[#1d00c4] hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,255,255,0.25)] active:scale-95 px-4.5 py-2.5 text-xs font-mono uppercase tracking-wider font-extrabold rounded-xl transition-all duration-200 ease-out shadow-md cursor-pointer"
            >
              Jump to Prototype
            </button>
          </header>
        )}

        <div className="mx-auto max-w-[1240px] border-x border-zinc-800/70 bg-zinc-950/40 backdrop-blur-[1px]">

          {/* ============ HERO ============ */}
          <section className="relative border-b border-zinc-800/70 px-6 py-16 sm:px-8 sm:py-20">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Product · Workflows · Opportunities
            </p>
            <h1 className="max-w-[20ch] font-sans text-4xl font-extrabold leading-[0.96] tracking-tight text-zinc-50 sm:text-6xl">
              The architecture<br />behind <span className="text-zinc-500 font-light">text&#8209;to&#8209;node</span> design.
            </h1>
            <div className="mt-7 h-1 w-14 bg-flame"></div>
            <p className="mt-7 max-w-[58ch] font-mono text-[13px] leading-relaxed text-zinc-400">
              A system map of the xFigura product — four product layers, four design-development
              primitives, and the three opportunities that connect them.
            </p>
          </section>

          {/* ============ SECTION 1 : PRODUCT LAYERS ============ */}
          <section className="border-b border-zinc-800/70">
            <div className="flex items-start justify-between px-6 pt-16 pb-8 sm:px-8">
              <div className="flex flex-col gap-2">
                <h2 className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-zinc-100 leading-[0.95]">
                  Product<br />Understanding
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Four product layers</span>
              </div>
              <span className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-flame leading-[0.95] select-none">01</span>
            </div>

            <div className="grid grid-cols-2 gap-px border-y border-zinc-800/70 bg-zinc-800/70 md:grid-cols-4">
              {/* L1 */}
              <article
                className="scard group bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('canvas')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-650">L1</span>
                  <span className="lab font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-650 transition-colors">Layer</span>
                </div>
                <img src="/canvas.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Canvas-Based Interaction</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The spatial workspace where users drop, arrange, and wire text, image, video, and 3D preview nodes.
                </p>
              </article>

              {/* L2 */}
              <article
                className="scard group bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('infrastructure')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-650">L2</span>
                  <span className="lab font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-650 transition-colors">Layer</span>
                </div>
                <img src="/infrastructure.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Infrastructure Layer</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The desktop-to-cloud data pipeline managing the Rhino plugin, parameter inputs, Speckle integration, and the Revit connection.
                </p>
              </article>

              {/* L3 */}
              <article
                className="scard group bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('model')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-650">L3</span>
                  <span className="lab font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-650 transition-colors">Layer</span>
                </div>
                <img src="/model.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Model Marketplace</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The backend aggregator engine that routes and processes third-party and proprietary models, including Flux, upscalers, and the Nano Banana suite.
                </p>
              </article>

              {/* L4 */}
              <article
                className="scard group bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('human')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-650">L4</span>
                  <span className="lab font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-650 transition-colors">Layer</span>
                </div>
                <img src="/human.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Human Connection Layer</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The multiplayer environment hosting markup tools, team collaboration features, and text annotations for design redlines.
                </p>
              </article>
            </div>
          </section>

          {/* ============ SECTION 2 : PRIMITIVES ============ */}
          <section className="border-b border-zinc-800/70">
            <div className="flex items-start justify-between px-6 pt-16 pb-8 sm:px-8">
              <div className="flex flex-col gap-2">
                <h2 className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-zinc-100 leading-[0.95]">
                  Early Design<br />Development
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Baseline workflow primitives</span>
              </div>
              <span className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-flame leading-[0.95] select-none">02</span>
            </div>

            <div className="grid grid-cols-2 gap-px border-y border-zinc-800/70 bg-zinc-800/70 md:grid-cols-4">
              {/* P-01 */}
              <article
                className="scard bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('massing')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-600">P-01</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"></span>Tracked
                  </span>
                </div>
                <img src="/massing.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Massing &amp; Adjacencies</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The geometry block handling spatial logic, bubble diagrams, volumetric configurations, and programmatic layouts.
                </p>
              </article>

              {/* P-02 */}
              <article
                className="scard bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('materiality')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-600">P-02</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"></span>Tracked
                  </span>
                </div>
                <img src="/materiality.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Surface &amp; Materiality</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The tactical block handling tectonic properties, surface textures, roughness, porosity, and material specifications.
                </p>
              </article>

              {/* P-03 */}
              <article
                className="scard bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('environmental')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-600">P-03</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"></span>Tracked
                  </span>
                </div>
                <img src="/environmental.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Environmental Values</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The contextual data block tracking solar orientation, azimuth angles, time of day, and microclimate conditions.
                </p>
              </article>

              {/* P-04 */}
              <article
                className="scard bg-zinc-950 p-6 cursor-pointer text-center flex flex-col items-center"
                onMouseEnter={() => setHighlightedIco('discourse')}
                onMouseLeave={() => setHighlightedIco(null)}
              >
                <div className="mb-8 flex items-center justify-between w-full">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-zinc-600">P-04</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"></span>Tracked
                  </span>
                </div>
                <img src="/discourse.png" alt="" className="ico mb-7 h-16 w-16" />
                <h3 className="text-[17px] font-bold leading-tight tracking-tight">Markup &amp; Discourse</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
                  The feedback block capturing sketch overlays, live review comments, annotations, and designer-to-principal team alignment.
                </p>
              </article>
            </div>
            <p className="px-6 py-4 font-mono text-[11px] text-zinc-600 sm:px-8">
              Hover a layer or primitive to trace where it appears across the opportunity map below.
            </p>
          </section>

          {/* ============ SECTION 3 : OPPORTUNITIES ============ */}
          <section className="px-6 pb-16 sm:px-8 border-b border-zinc-800/70">
            <div className="flex items-start justify-between pt-16 pb-9">
              <div className="flex flex-col gap-2">
                <h2 className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-zinc-100 leading-[0.95]">
                  The Three<br />Opportunities
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Active_focus: <span id="activeReadout" className="text-accent">{activeFocus}</span>
                </span>
              </div>
              <span className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-flame leading-[0.95] select-none">03</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="oppList">

              {/* OPP 01 */}
              <article
                className={getOppClass('OP-1')}
              >
                <div>
                  <h3 className={`text-[28px] font-black leading-[1.02] tracking-tight sm:text-[34px] transition-colors duration-300 ${activeFocus === 'OP-1' ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    Parametricizing<br className="hidden sm:inline" /> Text Inputs
                  </h3>

                  <div className="flex flex-col gap-5 mt-6 items-start">
                    {/* Product Row */}
                    <div className="flex items-start gap-4 w-full">
                      <span className="font-sans text-[11px] text-zinc-500 font-semibold uppercase tracking-wider min-w-[70px] select-none">Product</span>
                      <div className="flex items-center gap-2 justify-start flex-wrap flex-1">
                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'massing' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('massing')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'massing' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/massing.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">massing</span>
                        </span>

                        <div className="flex h-14 items-center justify-center font-bold text-zinc-650 text-sm shrink-0 px-0.5">+</div>

                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'canvas' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('canvas')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'canvas' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/canvas.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">canvas</span>
                        </span>

                        <div className="flex h-14 items-center justify-center font-bold text-zinc-650 text-sm shrink-0 px-0.5">+</div>

                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'infrastructure' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('infrastructure')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'infrastructure' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/infrastructure.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">infra</span>
                        </span>
                      </div>
                    </div>

                    {/* Workflow Row */}
                    <div className="flex items-start gap-4 w-full">
                      <span className="font-sans text-[11px] text-zinc-500 font-semibold uppercase tracking-wider min-w-[70px] select-none">Workflow</span>
                      <div className="flex items-center gap-2 justify-start flex-wrap flex-1">
                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'materiality' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('materiality')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'materiality' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/materiality.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">material</span>
                        </span>

                        <div className="flex h-14 items-center justify-center font-bold text-zinc-650 text-sm shrink-0 px-0.5">+</div>

                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'environmental' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('environmental')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'environmental' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/environmental.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">environ</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 border-t pt-5 flex flex-col justify-between flex-grow transition-colors duration-300 ${activeFocus === 'OP-1' ? 'border-zinc-800' : 'border-zinc-900/60'}`}>
                  <p className={`text-[13.5px] leading-relaxed transition-colors duration-300 ${activeFocus === 'OP-1' ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    Translating qualitative text strings into structured UI components — converting descriptive
                    language directly into parametric input blocks within the canvas framework.
                  </p>

                  <div className="flex items-center justify-between mt-8 pt-2">
                    <span className="font-mono text-xs text-zinc-500">OP - 1</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-900 text-zinc-350 px-2.5 py-1 text-[10px] font-bold tracking-wider rounded border border-zinc-800/60">
                        TEXT - TO - NODE
                      </span>
                      {activeFocus === 'OP-1' && (
                        <span className="bg-[#22c55e]/90 text-zinc-950 px-2.5 py-1 text-[10px] font-extrabold tracking-wider rounded">
                          FOCUS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>

              {/* OPP 02 */}
              <article
                className={getOppClass('OP-2')}
              >
                <div>
                  <h3 className={`text-[28px] font-black leading-[1.02] tracking-tight sm:text-[34px] transition-colors duration-300 ${activeFocus === 'OP-2' ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    Async Context<br className="hidden sm:inline" /> Capture
                  </h3>

                  <div className="flex flex-col gap-5 mt-6 items-start">
                    {/* Product Row */}
                    <div className="flex items-start gap-4 w-full">
                      <span className="font-sans text-[11px] text-zinc-500 font-semibold uppercase tracking-wider min-w-[70px] select-none">Product</span>
                      <div className="flex items-center gap-2 justify-start flex-wrap flex-1">
                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'human' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('human')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'human' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/human.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">human</span>
                        </span>

                        <div className="flex h-14 items-center justify-center font-bold text-zinc-650 text-sm shrink-0 px-0.5">+</div>

                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'infrastructure' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('infrastructure')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'infrastructure' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/infrastructure.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">infra</span>
                        </span>
                      </div>
                    </div>

                    {/* Workflow Row */}
                    <div className="flex items-start gap-4 w-full">
                      <span className="font-sans text-[11px] text-zinc-500 font-semibold uppercase tracking-wider min-w-[70px] select-none">Workflow</span>
                      <div className="flex items-center gap-2 justify-start flex-wrap flex-1">
                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'discourse' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('discourse')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'discourse' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/discourse.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">discourse</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 border-t pt-5 flex flex-col justify-between flex-grow transition-colors duration-300 ${activeFocus === 'OP-2' ? 'border-zinc-800' : 'border-zinc-900/60'}`}>
                  <p className={`text-[13.5px] leading-relaxed transition-colors duration-300 ${activeFocus === 'OP-2' ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    Automatically tracking, summarizing, and archiving the human intent, verbal notes, and
                    sketches behind canvas iterations — so team members can catch up asynchronously without
                    manual documentation.
                  </p>

                  <div className="flex items-center justify-between mt-8 pt-2">
                    <span className="font-mono text-xs text-zinc-500">OP - 2</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-900 text-zinc-350 px-2.5 py-1 text-[10px] font-bold tracking-wider rounded border border-zinc-800/60">
                        INTENT-TRACE
                      </span>
                      {activeFocus === 'OP-2' && (
                        <span className="bg-[#22c55e]/90 text-zinc-950 px-2.5 py-1 text-[10px] font-extrabold tracking-wider rounded">
                          FOCUS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>

              {/* OPP 03 */}
              <article
                className={getOppClass('OP-3')}
              >
                <div>
                  <h3 className={`text-[28px] font-black leading-[1.02] tracking-tight sm:text-[34px] transition-colors duration-300 ${activeFocus === 'OP-3' ? 'text-zinc-100' : 'text-zinc-300'}`}>
                    Parametric<br className="hidden sm:inline" /> Visualization
                  </h3>

                  <div className="flex flex-col gap-5 mt-6 items-start">
                    {/* Product Row */}
                    <div className="flex items-start gap-4 w-full">
                      <span className="font-sans text-[11px] text-zinc-500 font-semibold uppercase tracking-wider min-w-[70px] select-none">Product</span>
                      <div className="flex items-center gap-2 justify-start flex-wrap flex-1">
                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'canvas' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('canvas')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'canvas' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/canvas.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">canvas</span>
                        </span>
                      </div>
                    </div>

                    {/* Workflow Row */}
                    <div className="flex items-start gap-4 w-full">
                      <span className="font-sans text-[11px] text-zinc-500 font-semibold uppercase tracking-wider min-w-[70px] select-none">Workflow</span>
                      <div className="flex items-center gap-2 justify-start flex-wrap flex-1">
                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'massing' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('massing')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'massing' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/massing.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">massing</span>
                        </span>

                        <div className="flex h-14 items-center justify-center font-bold text-zinc-650 text-sm shrink-0 px-0.5">+</div>

                        <span
                          className={`chip flex flex-col items-center gap-1 transition-all cursor-pointer ${highlightedIco === 'materiality' ? 'scale-105 font-bold text-blue-400' : ''}`}
                          onMouseEnter={() => setHighlightedIco('materiality')}
                          onMouseLeave={() => setHighlightedIco(null)}
                        >
                          <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#2b26f5] shadow-sm transition-all duration-200 ${highlightedIco === 'materiality' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''}`}>
                            <img src="/materiality.png" className="h-6 w-6 brightness-0 invert" alt="" />
                          </span>
                          <span className="font-mono text-[9px] text-zinc-500 lowercase">material</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 border-t pt-5 flex flex-col justify-between flex-grow transition-colors duration-300 ${activeFocus === 'OP-3' ? 'border-zinc-800' : 'border-zinc-900/60'}`}>
                  <p className={`text-[13.5px] leading-relaxed transition-colors duration-300 ${activeFocus === 'OP-3' ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    Generating, adjusting, and viewing complex architectural components — like facade systems
                    and structural tectonics — directly inside the spatial 3D canvas to evaluate scale, depth,
                    and proportions instantly.
                  </p>

                  <div className="flex items-center justify-between mt-8 pt-2">
                    <span className="font-mono text-xs text-zinc-500">OP - 3</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-900 text-zinc-350 px-2.5 py-1 text-[10px] font-bold tracking-wider rounded border border-zinc-800/60">
                        CANVAS-NATIVE
                      </span>
                      {activeFocus === 'OP-3' && (
                        <span className="bg-[#22c55e]/90 text-zinc-950 px-2.5 py-1 text-[10px] font-extrabold tracking-wider rounded">
                          FOCUS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>

            </div>
          </section>

          {/* ============ SECTION 4 : LIVE SANDBOX CANVAS ============ */}
          <section id="sandbox-canvas-section" className="px-6 pb-16 sm:px-8 border-b border-zinc-800/70 pt-12">
            <div className="flex items-start justify-between pb-9">
              <div className="flex flex-col gap-2">
                <h2 className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-zinc-100 leading-[0.95]">
                  Text-to-Node<br />Prototype
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Live sandbox
                </span>
              </div>
              <span className="font-sans text-4xl md:text-[64px] font-bold tracking-tight text-flame leading-[0.95] select-none">04</span>
            </div>

            {/* The Core UI Elements & Interactions Subsection */}
            <div className="mb-12 border-t border-zinc-800/70 pt-10">
              <h3 className="font-sans text-xl md:text-2xl font-bold tracking-tight text-zinc-100 mb-2">
                The Core UI Elements &amp; Interactions
              </h3>
              <p className="text-sm text-zinc-400 max-w-3xl mb-6 font-light leading-relaxed">
                The text-to-node interface relies on three core UI components that work together across the layout canvas:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="border border-zinc-800/70 bg-zinc-900/10 p-5 rounded-xl">
                  <h4 className="font-sans font-bold text-zinc-200 text-sm mb-2.5">Source Text Node</h4>
                  <p className="text-[13px] leading-relaxed text-zinc-450 font-light">
                    The entry point on the left of the canvas where you type the prompt. It tokenizes terms like <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-violet-400">/visualization</span>, <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-violet-400">/deep</span>, and <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-violet-400">/rotate</span> into active pills. Clicking Parametricize kicks off the graph generation.
                  </p>
                </div>
                <div className="border border-zinc-800/70 bg-zinc-900/10 p-5 rounded-xl">
                  <h4 className="font-sans font-bold text-zinc-200 text-sm mb-2.5">Decoupled Parameter Sliders</h4>
                  <p className="text-[13px] leading-relaxed text-zinc-450 font-light">
                    Independent control cards that spawn on the canvas with clear 20px vertical spacing. They map the parsed variables into manual controls with direct numeric readouts (20 mm, 44°, 70%, 5').
                  </p>
                </div>
                <div className="border border-zinc-800/70 bg-zinc-900/10 p-5 rounded-xl">
                  <h4 className="font-sans font-bold text-zinc-200 text-sm mb-2.5">Main Generation Hub</h4>
                  <p className="text-[13px] leading-relaxed text-zinc-450 font-light">
                    The central parent card positioned in the middle of the workspace. It features visual input sockets on the left edge to receive data wires from the parameter sliders, a reference image dropzone, and a Generate Visualization button at the base to render the final preview node.
                  </p>
                </div>
              </div>

              <div className="relative group/img overflow-hidden rounded-2xl border border-zinc-800/80 shadow-2xl">
                <img
                  src="/UI components.png"
                  alt="xFigura UI Components"
                  className="w-full opacity-95 group-hover/img:opacity-100 transition-opacity duration-300"
                />
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="absolute top-4 right-4 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-350 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all duration-200 opacity-0 group-hover/img:opacity-100 shadow-lg backdrop-blur-sm flex items-center gap-1.5 cursor-pointer z-10 hover:scale-[1.03] active:scale-95"
                >
                  <Maximize2 size={12} className="text-zinc-400 group-hover/img:text-white" />
                  <span>Enlarge</span>
                </button>
              </div>
            </div>

            {/* Data Vector Mapping Subsection (Collapsible) */}
            <details className="group border border-zinc-800/70 rounded-2xl bg-zinc-900/10 overflow-hidden mb-12 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-sans text-lg md:text-xl font-bold tracking-tight text-zinc-200 select-none hover:bg-zinc-900/20 hover:text-zinc-100 transition-colors focus:outline-none">
                <span>Data Vector Mapping</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-zinc-500">
                  <ChevronDown size={20} />
                </span>
              </summary>
              <div className="p-6 border-t border-zinc-800/70 bg-zinc-950/20 flex flex-col gap-6">
                <p className="text-sm text-zinc-400 font-light leading-relaxed">
                  The engine categorizes incoming text strings into two distinct data tracks to dynamically structure the spatial workspace:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-zinc-800/70 bg-zinc-900/20 p-5 rounded-xl">
                    <h4 className="font-sans font-bold text-zinc-200 text-sm mb-2">The Explicit Track (Slash-Commands)</h4>
                    <p className="text-[13px] leading-relaxed text-zinc-450 font-light">
                      Direct tags like <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-violet-400">/visualization</span>, <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-violet-400">/deep</span>, or <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-violet-400">/rotate</span> act as absolute node triggers. They bypass interpretation to immediately generate the central hub or map straight to fixed numeric slider ranges (like 20 mm depth or 44° rotation).
                    </p>
                  </div>
                  <div className="border border-zinc-800/70 bg-zinc-900/20 p-5 rounded-xl">
                    <h4 className="font-sans font-bold text-zinc-200 text-sm mb-2">The Implicit Track (Context Parsing)</h4>
                    <p className="text-[13px] leading-relaxed text-zinc-450 font-light">
                      The system scans the un-tagged prose to capture qualitative descriptions and structural nouns. Words like <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-cyan-400">"rough"</span> or <span className="font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded text-cyan-400">"podium base"</span> are automatically translated into background numeric parameters (like 70% roughness or 5' height) without requiring manual tags.
                    </p>
                  </div>
                </div>
              </div>
            </details>

            <div id="interactive-canvas-section" className="mb-6 border-t border-zinc-800/70 pt-10">
              <h3 className="font-sans text-xl md:text-2xl font-bold tracking-tight text-zinc-100">
                Interactive Text-to-Node Canvas
              </h3>
            </div>

            {!isCanvasEnlarged ? (
              <div className="w-full h-[600px] border border-zinc-800/70 rounded-2xl overflow-hidden relative bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.85)]">
                {/* Main interactive canvas area */}
                <Canvas />

                {/* Custom floating toolbars matching mockup */}
                <SidebarControls />

                {/* Enlarge/Minimize Button */}
                <button
                  onClick={() => toggleEnlarge(true)}
                  className="absolute top-4 right-4 z-40 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-zinc-350 hover:bg-zinc-900 hover:text-zinc-100 transition-all shadow-lg backdrop-blur-sm group cursor-pointer"
                  title="Enlarge Canvas"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-105">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  <span>Enlarge</span>
                </button>
              </div>
            ) : (
              <div className="w-full h-[600px] border border-zinc-800/60 border-dashed rounded-2xl bg-zinc-950/40 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-300">Fullscreen Mode Active</h4>
                  <p className="text-zinc-500 text-xs mt-1">The spatial canvas is expanded to fill the entire viewport.</p>
                </div>
                <button
                  onClick={() => toggleEnlarge(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-all cursor-pointer"
                >
                  Collapse Sandbox
                </button>
              </div>
            )}
          </section>

          {/* ============ FOOTER ============ */}
          <footer className="flex items-center justify-between px-6 py-5 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-600 sm:px-8">
            <span>
              <a href="https://narayan.works" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-350 transition-colors normal-case">Narayan Ashanahalli</a> &copy; 2026
            </span>
            <span className="flex items-center gap-3">
              <span className="text-zinc-800">|</span>  Text-to-Node xFIGURA
            </span>
          </footer>

        </div>
      </div>

      {/* Enlarge Image Modal */}
      {isImageModalOpen && (
        <div
          onClick={() => setIsImageModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}
              className="absolute -top-12 right-0 text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Close</span>
              <X size={14} />
            </button>
            <img
              src="/UI components.png"
              alt="xFigura UI Components"
              className="max-w-full max-h-[80vh] rounded-xl object-contain border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

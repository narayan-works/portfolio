import React from 'react';
import { useCanvas } from '../../context/CanvasContext';
import { Plus, Wrench, Eye, ChevronDown, RotateCcw, Trash2, Sliders } from 'lucide-react';

export const SidebarControls: React.FC = () => {
  const {
    addNode,
    resetCanvas,
    setPan,
    setZoom,
    selectedNodeId,
    deleteNode
  } = useCanvas();

  const handleAddDefaultNode = () => {
    // Spawn a new node in the middle of the viewport
    const centerX = (window.innerWidth / 2 - 150 - 50) / 0.95;
    const centerY = (window.innerHeight / 2 - 100 - 50) / 0.95;
    addNode('service', centerX, centerY);
  };

  const handleResetView = () => {
    resetCanvas();
    setPan({ x: 50, y: 50 });
    setZoom(0.95);
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId);
    }
  };

  return (
    <>
      {/* 1. Top Horizontal Selector Pill */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-1.5 bg-zinc-900/75 backdrop-blur-md border border-zinc-800/80 rounded-full pl-2.5 pr-3.5 py-1.5 shadow-xl w-fit pointer-events-auto select-none">
        {/* Custom X Logo */}
        <img
          src="/xfigura_logo.jpeg"
          className="w-4 h-4 object-cover rounded-sm"
          alt="logo"
        />
        <ChevronDown size={12} className="text-zinc-500 hover:text-zinc-300 cursor-pointer" />
        <div className="w-[1px] h-3 bg-zinc-800 mx-1" />
        <span className="font-trispace text-[11px] text-zinc-400 font-bold tracking-wider">
          canvas_01
        </span>
      </div>

      {/* 2. Vertically Centered Left Pillars */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4 pointer-events-auto select-none">
        
        {/* Middle Vertical Tools Pill */}
        <div className="flex flex-col items-center gap-4 bg-zinc-900/75 backdrop-blur-md border border-zinc-800/80 rounded-[24px] p-2 shadow-xl w-12">
          {/* Circled Active Logo */}
          <div className="w-8 h-8 rounded-full border border-zinc-200/90 flex items-center justify-center bg-zinc-800/40 text-white shadow-[0_0_8px_rgba(255,255,255,0.15)] cursor-pointer">
            <img
              src="/xfigura_logo.jpeg"
              className="w-4 h-4 object-cover rounded-sm"
              alt="logo"
            />
          </div>

          {/* Freehand scribble / Bezier wire icon */}
          <div className="p-1 cursor-pointer group">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 15c2-5 4-5 6 0s4 5 6 0 2-5 4-2" />
            </svg>
          </div>

          {/* Inspect eye icon */}
          <button className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
            <Eye size={18} />
          </button>
        </div>

        {/* Bottom Vertical Actions Pill */}
        <div className="flex flex-col items-center gap-5 bg-zinc-900/75 backdrop-blur-md border border-zinc-800/80 rounded-[28px] px-2 py-3 shadow-xl w-12">
          {/* Add node trigger */}
          <button
            onClick={handleAddDefaultNode}
            title="Add Service Node"
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:scale-110 transition-all cursor-pointer"
          >
            <Plus size={20} />
          </button>

          {/* Add slider trigger */}
          <button
            onClick={() => {
              const centerX = (window.innerWidth / 2 - 150 - 50) / 0.95;
              const centerY = (window.innerHeight / 2 - 100 - 50) / 0.95;
              addNode('slider', centerX, centerY);
            }}
            title="Add Slider Node"
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:scale-110 transition-all cursor-pointer"
          >
            <Sliders size={18} />
          </button>

          {/* Settings wrench */}
          <button className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
            <Wrench size={18} />
          </button>

          {/* S-curve connector icon */}
          <div className="p-1 cursor-pointer group">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M 6 6 C 12 6, 12 18, 18 18" />
              <circle cx="6" cy="6" r="1.5" fill="currentColor" />
              <circle cx="18" cy="18" r="1.5" fill="currentColor" />
            </svg>
          </div>

          {/* Delete selected node trigger */}
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedNodeId}
            title="Delete Selected Node"
            className={`p-1 transition-all cursor-pointer ${
              selectedNodeId
                ? 'text-rose-500/80 hover:text-rose-400 hover:scale-110'
                : 'text-zinc-600 cursor-not-allowed opacity-40'
            }`}
          >
            <Trash2 size={16} />
          </button>

          {/* History / Reset view trigger */}
          <button
            onClick={handleResetView}
            title="Reset Canvas Layout"
            className="p-1 text-zinc-500 hover:text-zinc-300 hover:rotate-180 duration-500 transition-all cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>

          {/* User profile avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer mt-1">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=80&h=80"
              className="w-full h-full object-cover grayscale brightness-95"
              alt="User avatar"
            />
          </div>
        </div>

      </div>
    </>
  );
};

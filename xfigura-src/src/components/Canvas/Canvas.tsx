import React, { useRef, useState, useEffect } from 'react';
import { useCanvas } from '../../context/CanvasContext';
import { BaseNode } from '../Nodes/BaseNode';

export const Canvas: React.FC = () => {
  const {
    nodes,
    connections,
    pan,
    zoom,
    setPan,
    setZoom,
    connecting,
    socketOffsets,
    removeConnection,
    setSelectedNodeId
  } = useCanvas();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle canvas background panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if clicking on the background grid (not a node/button/port)
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('dot-grid')) {
      setIsPanning(true);
      setPanStart({ ...pan });
      setDragStart({ x: e.clientX, y: e.clientY });
      setSelectedNodeId(null); // Deselect on background click
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPan({
      x: panStart.x + dx,
      y: panStart.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Zoom centered on cursor position using native event listener to allow e.preventDefault()
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.closest('textarea') ||
          target.closest('input') ||
          target.closest('.no-zoom'))
      ) {
        return;
      }

      e.preventDefault();
      const zoomFactor = 1.05;
      const nextZoom = e.deltaY < 0
        ? Math.min(2, zoom * zoomFactor)
        : Math.max(0.3, zoom / zoomFactor);

      const rect = canvasEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Un-scale and un-translate to find point in canvas coordinates
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;

      setZoom(nextZoom);
      setPan({
        x: mouseX - canvasX * nextZoom,
        y: mouseY - canvasY * nextZoom
      });
    };

    canvasEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [pan, zoom, setPan, setZoom]);

  // Compute bezier curve path between two points
  const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    // S-curve curvature factor
    const dx = Math.max(80, Math.abs(x2 - x1) * 0.5);
    
    // Draw S-curve (cubic bezier curve)
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  // Get color for connection wire stroke
  const getWireStrokeColor = (dataType: string) => {
    switch (dataType) {
      case 'http': return '#22d3ee'; // cyan-400
      case 'grpc': return '#a78bfa'; // violet-400
      case 'sql': return '#34d399';  // emerald-400
      case 'event': return '#fbbf24'; // amber-400
      case 'stream': return '#60a5fa'; // blue-400
      default: return '#a1a1aa';     // zinc-400
    }
  };

  // Render a specific architectural node
  const renderNode = (node: any) => {
    return <BaseNode key={node.id} node={node} />;
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full bg-zinc-950 overflow-hidden cursor-grab ${
        isPanning ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Pan & Zoom Transformed Canvas Content Container */}
      <div
        className="absolute w-[10000px] h-[10000px] dot-grid origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '5000px',
          height: '5000px'
        }}
      >
        {/* SVG overlay for Connections (wires) */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <defs>
            {/* Custom linear gradients for connections */}
            <linearGradient id="grad-http" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad-grpc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad-sql" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad-event" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Render Active Connections */}
          {connections.map((conn) => {
            const fromSocket = socketOffsets[conn.fromPortId];
            const toSocket = socketOffsets[conn.toPortId];
            const fromNode = nodes.find((n) => n.id === conn.fromNodeId);
            const toNode = nodes.find((n) => n.id === conn.toNodeId);

            if (!fromSocket || !toSocket || !fromNode || !toNode) return null;

            // Compute port coords in canvas space
            const x1 = fromNode.x + fromSocket.rx;
            const y1 = fromNode.y + fromSocket.ry;
            const x2 = toNode.x + toSocket.rx;
            const y2 = toNode.y + toSocket.ry;

            const path = getBezierPath(x1, y1, x2, y2);
            const strokeColor = getWireStrokeColor(conn.dataType);

            return (
              <g key={conn.id} className="group pointer-events-auto cursor-pointer">
                {/* Thick invisible interaction wire for easier click/hover detection */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete connection?')) {
                      removeConnection(conn.id);
                    }
                  }}
                />
                {/* Thin rendering wire */}
                <path
                  d={path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2}
                  className="transition-all duration-200 group-hover:stroke-white group-hover:stroke-[3px] shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                />
                {/* Dynamic flow pulsing dots along the wire */}
                <path
                  d={path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  strokeOpacity={0.6}
                  className="connection-line"
                />
              </g>
            );
          })}

          {/* Render Dragging Wire */}
          {connecting && (
            <path
              d={getBezierPath(
                connecting.startX,
                connecting.startY,
                connecting.currentX,
                connecting.currentY
              )}
              fill="none"
              stroke={getWireStrokeColor(connecting.dataType)}
              strokeWidth={2}
              strokeDasharray="4 4"
              className="animate-pulse shadow-md"
            />
          )}
        </svg>

        {/* Render Architectural Nodes */}
        {nodes.map(renderNode)}
      </div>
    </div>
  );
};

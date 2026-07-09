import React, { useRef, useEffect } from 'react';
import { useCanvas } from '../../context/CanvasContext';
import type { PortType } from '../../types/canvas';

interface SocketProps {
  id: string;
  nodeId: string;
  name: string;
  type: PortType;
  dataType: 'http' | 'grpc' | 'sql' | 'event' | 'stream' | 'raw';
  label?: string;
}

export const DATA_TYPE_COLORS = {
  http: {
    dot: 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]',
    border: 'border-cyan-500/50 hover:border-cyan-400',
    text: 'text-cyan-400',
    bg: 'bg-cyan-950/30'
  },
  grpc: {
    dot: 'bg-violet-500 shadow-[0_0_8px_rgba(167,139,250,0.6)]',
    border: 'border-violet-500/50 hover:border-violet-400',
    text: 'text-violet-400',
    bg: 'bg-violet-950/30'
  },
  sql: {
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    border: 'border-emerald-500/50 hover:border-emerald-400',
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/30'
  },
  event: {
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    border: 'border-amber-500/50 hover:border-amber-400',
    text: 'text-amber-400',
    bg: 'bg-amber-950/30'
  },
  stream: {
    dot: 'bg-blue-500 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
    border: 'border-blue-500/50 hover:border-blue-400',
    text: 'text-blue-400',
    bg: 'bg-blue-950/30'
  },
  raw: {
    dot: 'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.4)]',
    border: 'border-zinc-500/50 hover:border-zinc-400',
    text: 'text-zinc-400',
    bg: 'bg-zinc-900/30'
  }
};

export const Socket: React.FC<SocketProps> = ({
  id,
  nodeId,
  type,
  dataType,
  label
}) => {
  const {
    nodes,
    zoom,
    connecting,
    registerSocket,
    unregisterSocket,
    startConnecting,
    updateConnecting,
    stopConnecting
  } = useCanvas();

  const socketRef = useRef<HTMLDivElement>(null);
  const color = DATA_TYPE_COLORS[dataType];

  // Report center coordinate offset relative to the node wrapper (not this socket element)
  const getNodeElement = () => {
    if (!socketRef.current) return null;
    const parent = socketRef.current.parentElement;
    return parent?.closest('[data-node-id]') ?? null;
  };

  const updateOffset = () => {
    if (socketRef.current) {
      const nodeElement = getNodeElement();
      if (nodeElement) {
        const socketRect = socketRef.current.getBoundingClientRect();
        const nodeRect = nodeElement.getBoundingClientRect();

        const rx = (socketRect.left - nodeRect.left + socketRect.width / 2) / zoom;
        const ry = (socketRect.top - nodeRect.top + socketRect.height / 2) / zoom;

        registerSocket(id, nodeId, rx, ry, type, dataType);
      }
    }
  };

  useEffect(() => {
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => {
      window.removeEventListener('resize', updateOffset);
      unregisterSocket(id);
    };
  }, [id, nodeId, zoom, registerSocket, unregisterSocket]);

  // Re-measure when nodes move or layout shifts
  useEffect(() => {
    updateOffset();
    const timer = setTimeout(updateOffset, 50);
    const raf = requestAnimationFrame(updateOffset);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const nodeElement = getNodeElement();
    if (!nodeElement) return;
    const socketRect = socketRef.current!.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();
    const rx = (socketRect.left - nodeRect.left + socketRect.width / 2) / zoom;
    const ry = (socketRect.top - nodeRect.top + socketRect.height / 2) / zoom;

    const startX = node.x + rx;
    const startY = node.y + ry;

    startConnecting(nodeId, id, type, dataType, startX, startY);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startMouseX) / zoom;
      const dy = (moveEvent.clientY - startMouseY) / zoom;
      updateConnecting(startX + dx, startY + dy);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const targetElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const targetSocketDot = targetElement?.closest('[data-socket-id]');
      
      if (targetSocketDot) {
        const targetSocketId = targetSocketDot.getAttribute('data-socket-id')!;
        const targetNodeId = targetSocketDot.getAttribute('data-socket-node-id')!;
        const targetType = targetSocketDot.getAttribute('data-socket-type')!;

        if (targetNodeId !== nodeId && targetType !== type) {
          stopConnecting(targetNodeId, targetSocketId);
          return;
        }
      }

      stopConnecting();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (connecting && connecting.nodeId !== nodeId && connecting.portType !== type) {
      e.stopPropagation();
      stopConnecting(nodeId, id);
    }
  };

  const isInput = type === 'input';
  const isRaw = dataType === 'raw';
  
  const labelElement = label && (
    <span className={`text-[10px] uppercase tracking-wider font-semibold select-none ${color.text} font-trispace`}>
      {label}
    </span>
  );

  const rawInputStyle = 'w-1.5 h-5 bg-[#D8AD74] hover:bg-[#e8c090] rounded-full border border-[#D8AD74]/40 shadow-[0_0_8px_rgba(216,173,116,0.35)]';
  const rawOutputStyle = 'w-1.5 h-5 bg-[#e4e4e7] hover:bg-white rounded-full border border-zinc-800/40';

  return (
    <div
      ref={socketRef}
      data-socket-id={id}
      data-socket-node-id={nodeId}
      data-socket-type={type}
      onMouseUp={handleMouseUp}
      className={`flex items-center gap-2 relative ${
        isInput ? 'flex-row' : 'flex-row-reverse'
      } group cursor-crosshair h-5`}
    >
      {/* Socket dot / pill */}
      <div
        onMouseDown={type === 'output' ? handleMouseDown : undefined}
        className={isRaw
          ? `${isInput ? rawInputStyle : rawOutputStyle} flex items-center justify-center transition-all duration-200 z-10 cursor-grab active:cursor-grabbing`
          : `w-3.5 h-3.5 rounded-full border bg-zinc-900 flex items-center justify-center transition-all duration-200 z-10 ${
              color.border
            } ${
              connecting && connecting.nodeId !== nodeId && connecting.portType !== type
                ? 'scale-125 ring-2 ring-zinc-400'
                : 'group-hover:scale-110'
            }`
        }
      >
        {!isRaw && (
          <div className={`w-1.5 h-1.5 rounded-full transition-transform duration-200 ${color.dot} ${
            type === 'output' ? 'cursor-grab active:cursor-grabbing' : ''
          }`} />
        )}
      </div>
      {labelElement}
    </div>
  );
};

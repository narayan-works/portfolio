import React, { useRef } from 'react';
import { useCanvas } from '../../context/CanvasContext';
import type { NodeData } from '../../types/canvas';
import { GripHorizontal } from 'lucide-react';

interface NodeWrapperProps {
  node: NodeData;
  children: React.ReactNode;
  icon: React.ReactNode;
  showHeader?: boolean;
}

export const NodeWrapper: React.FC<NodeWrapperProps> = ({
  node,
  children,
  icon,
  showHeader = true
}) => {
  const {
    zoom,
    selectedNodeId,
    setSelectedNodeId,
    updateNodePosition
  } = useCanvas();

  const isSelected = selectedNodeId === node.id;
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Select this node
    setSelectedNodeId(node.id);
    
    // Prevent dragging when clicking buttons, inputs, or socket handles
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[data-socket-id]') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }

    e.stopPropagation();

    const startX = node.x;
    const startY = node.y;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startMouseX) / zoom;
      const dy = (moveEvent.clientY - startMouseY) / zoom;
      updateNodePosition(node.id, Math.max(0, startX + dx), Math.max(0, startY + dy));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getStatusColor = (status: NodeData['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]';
      case 'warning':
        return 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.7)]';
      case 'offline':
        return 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]';
    }
  };

  if (!showHeader) {
    // Headerless mode: container itself handles mouse-down drag gestures
    return (
      <div
        ref={nodeRef}
        data-node-id={node.id}
        style={{
          transform: `translate(${node.x}px, ${node.y}px)`,
          position: 'absolute',
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNodeId(node.id);
        }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={nodeRef}
      data-node-id={node.id}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        position: 'absolute',
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeId(node.id);
      }}
      className={`w-72 bg-zinc-900/90 backdrop-blur-md border rounded-lg shadow-xl select-none transition-shadow duration-200 z-10 ${
        isSelected
          ? 'border-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.2)] ring-1 ring-violet-500/40'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Node Header & Drag Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 cursor-grab active:cursor-grabbing hover:bg-zinc-800/20 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${getStatusColor(node.status)}`} />
          <div className="text-zinc-400 group-hover:text-zinc-200">{icon}</div>
          <span className="font-semibold text-xs text-zinc-200 tracking-wide select-none">
            {node.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
          <GripHorizontal size={14} className="text-zinc-500 cursor-grab" />
        </div>
      </div>

      {/* Node Content wrapper */}
      <div className="relative p-4 flex flex-col gap-3.5">{children}</div>
    </div>
  );
};

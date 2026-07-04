import React, { useState, useRef, useEffect } from 'react';
import { useCanvas } from '../../context/CanvasContext';
import { Socket } from './Socket';
import { NodeWrapper } from './NodeWrapper';
import type { NodeData } from '../../types/canvas';
import { Settings, Download, Image, Box, Building, Eye, Sliders, Pencil } from 'lucide-react';

interface NodeProps {
  node: NodeData;
}

interface Suggestion {
  name: string;
  type: 'Input' | 'Output' | 'Parameter';
  description: string;
  icon: 'image' | 'rhino' | 'revit' | 'output' | 'parameter';
}

const ALL_SUGGESTIONS: Suggestion[] = [
  { name: 'image', type: 'Input', description: 'from image upload', icon: 'image' },
  { name: 'rhino', type: 'Input', description: 'from rhino viewport', icon: 'rhino' },
  { name: 'revit', type: 'Input', description: 'from revit architecture model', icon: 'revit' },
  { name: 'visualization', type: 'Output', description: 'image render output', icon: 'output' },
  { name: 'deep', type: 'Parameter', description: 'vertical depth parameter', icon: 'parameter' },
  { name: 'rotate', type: 'Parameter', description: 'louver rotation angle', icon: 'parameter' },
  { name: 'rough', type: 'Parameter', description: 'rough limestone finish preset', icon: 'parameter' },
  { name: 'thickness', type: 'Parameter', description: 'facade wall thickness', icon: 'parameter' },
  { name: 'opening', type: 'Parameter', description: 'glazing aperture width %', icon: 'parameter' },
  { name: 'facade', type: 'Parameter', description: 'structural facade preset', icon: 'parameter' },
  { name: 'timber', type: 'Parameter', description: 'heavy timber properties', icon: 'parameter' },
  { name: 'podium', type: 'Parameter', description: 'concrete podium dimensions', icon: 'parameter' },
  { name: 'louvers', type: 'Parameter', description: 'vertical louvers spacing', icon: 'parameter' },
  { name: 'vertical', type: 'Parameter', description: 'vertical orient layout preset', icon: 'parameter' },
  { name: 'base', type: 'Parameter', description: 'foundation base structure offset', icon: 'parameter' }
];

const parsePrompt = (promptText: string) => {
  const inputs: string[] = [];
  let output = 'visualization';

  if (promptText.includes('heavy timber facade') || promptText.includes('/visualization')) {
    return {
      inputs: ['Image', 'Depth', 'Rotate', 'Roughness', 'Base Height'],
      output: 'visualization'
    };
  }

  const words = promptText.split(/\s+/);
  words.forEach((word) => {
    if (word.startsWith('/')) {
      const cleanWord = word.replace(/[.,\/#!$%\^\&\*;:{}=\-_`~()]/g, "");
      const cmd = cleanWord.toLowerCase();

      const labelMap: Record<string, string> = {
        image: 'Image',
        rhino: 'Rhino View',
        revit: 'Revit Model',
        deep: 'Depth',
        rotate: 'Rotate',
        rough: 'Roughness',
        thickness: 'Thickness',
        opening: 'Opening',
        facade: 'Facade',
        timber: 'Timber',
        podium: 'Podium',
        louvers: 'Louvers',
        vertical: 'Vertical',
        base: 'Base Height'
      };

      if (cmd === 'visualization') {
        output = 'visualization';
      } else if (labelMap[cmd]) {
        inputs.push(labelMap[cmd]);
      } else {
        inputs.push(cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1));
      }
    }
  });

  const uniqueInputs = Array.from(new Set(inputs));
  if (uniqueInputs.length === 0) {
    uniqueInputs.push('Image', 'Depth', 'Rotate', 'Roughness', 'Base Height');
  }

  return { inputs: uniqueInputs, output };
};

// Socket bar width — matches the w-1.5 (6px) pill
const SOCKET_W = 6;
const SOCKET_GAP = 10; // px gap between socket and cell

export const BaseNode: React.FC<NodeProps> = ({ node }) => {
  const { selectedNodeId, updateNodeDetails, spawnInputNodes, addGeneratedNode, spawnOutputNode, connections } = useCanvas();
  const isSelected = selectedNodeId === node.id;
  const defaultPrompt = "Generating a /visualization a heavy timber facade system with /deep vertical louvers that gradually /rotate, using a rough limestone podium base. /";

  const [text, setText] = useState(node.details.generatedPrompt || defaultPrompt);
  const [isFocused, setIsFocused] = useState(false);
  const [isPromptEditing, setIsPromptEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [triggerIdx, setTriggerIdx] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateHint, setShowGenerateHint] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });

  const dismissGenerateHint = () => {
    setShowGenerateHint(false);
  };

  const updateCoords = () => {
    if (triggerRef.current) {
      const el = triggerRef.current;
      const styledDiv = document.getElementById(`styled-text-${node.id}`);
      if (styledDiv) {
        const parentRect = styledDiv.parentElement?.getBoundingClientRect();
        const triggerRect = el.getBoundingClientRect();
        if (parentRect && triggerRect) {
          setDropdownCoords({
            top: triggerRect.bottom - parentRect.top,
            left: triggerRect.left - parentRect.left,
          });
        }
      }
    }
  };

  useEffect(() => {
    if (showDropdown) {
      updateCoords();
      requestAnimationFrame(updateCoords);
    }
  }, [showDropdown, text, triggerIdx]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const styledDiv = document.getElementById(`styled-text-${node.id}`);
    if (styledDiv) {
      styledDiv.scrollTop = e.currentTarget.scrollTop;
    }
    if (showDropdown) updateCoords();
  };

  useEffect(() => { setSelectedIdx(0); }, [dropdownSearch]);

  useEffect(() => {
    if (!isPromptEditing && node.details.generatedPrompt) {
      setText(node.details.generatedPrompt);
    }
  }, [isPromptEditing, node.details.generatedPrompt]);

  useEffect(() => {
    if (!isPromptEditing) return;
    const t = window.setTimeout(() => { textareaRef.current?.focus(); }, 0);
    return () => window.clearTimeout(t);
  }, [isPromptEditing]);

  const commitPromptEdit = () => {
    setIsPromptEditing(false);
    setShowDropdown(false);
    setIsFocused(false);
    updateNodeDetails(node.id, { generatedPrompt: text });
  };

  const categoryOrder = { Input: 1, Output: 2, Parameter: 3 };
  const filteredSuggestions = ALL_SUGGESTIONS.filter((s) =>
    s.name.toLowerCase().startsWith(dropdownSearch)
  ).sort((a, b) => categoryOrder[a.type] - categoryOrder[b.type]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const lastSlashIdx = textBeforeCursor.lastIndexOf('/');
    if (lastSlashIdx !== -1) {
      const textAfterSlash = textBeforeCursor.substring(lastSlashIdx + 1);
      if (!textAfterSlash.includes(' ') && !textAfterSlash.includes('\n')) {
        setShowDropdown(true);
        setDropdownSearch(textAfterSlash.toLowerCase());
        setTriggerIdx(lastSlashIdx);
        return;
      }
    }
    setShowDropdown(false);
  };

  const insertSuggestion = (suggestionName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const value = text;
    const cursor = textarea.selectionStart;
    const before = value.substring(0, triggerIdx);
    const after = value.substring(cursor);
    const inserted = `/${suggestionName} `;
    const newValue = before + inserted + after;
    setText(newValue);
    setShowDropdown(false);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = triggerIdx + inserted.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((p) => (p + 1) % filteredSuggestions.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((p) => (p - 1 + filteredSuggestions.length) % filteredSuggestions.length); }
      else if (e.key === 'Enter') { e.preventDefault(); insertSuggestion(filteredSuggestions[selectedIdx].name); }
      else if (e.key === 'Escape') { e.preventDefault(); setShowDropdown(false); }
    }
  };

  const getSuggestionIcon = (iconType: Suggestion['icon']) => {
    switch (iconType) {
      case 'image': return <Image size={14} className="text-zinc-400 shrink-0" />;
      case 'rhino': return <Box size={14} className="text-zinc-400 shrink-0" />;
      case 'revit': return <Building size={14} className="text-zinc-400 shrink-0" />;
      case 'output': return <Eye size={14} className="text-zinc-400 shrink-0" />;
      default: return <Sliders size={14} className="text-zinc-400 shrink-0" />;
    }
  };

  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;
    const words = rawText.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('/')) {
        const match = word.match(/^\/([a-zA-Z0-9_-]+)(.*)$/);
        if (match) {
          const command = match[1];
          const punctuation = match[2];
          const suggestion = ALL_SUGGESTIONS.find((s) => s.name === command);
          let badgeClass = 'inline-flex items-center py-0.5 rounded-sm bg-zinc-800/80 text-zinc-200 font-sans text-xs font-light leading-none';
          if (suggestion?.type === 'Input') {
            badgeClass = 'inline-flex items-center py-0.5 rounded-sm bg-cyan-950/50 text-cyan-300 font-sans text-xs font-light leading-none';
          } else if (suggestion?.type === 'Parameter') {
            badgeClass = 'inline-flex items-center py-0.5 rounded-sm bg-violet-950/50 text-violet-300 font-sans text-xs font-light leading-none';
          }
          return (
            <span key={idx}>
              <span className={badgeClass}>/{command}</span>
              {punctuation}
            </span>
          );
        }
      }
      return <span key={idx}>{word}</span>;
    });
  };

  const isGenerator = node.id === 'node-generator' && !node.details.generatedInputs;
  const isSlider = node.type === 'slider';

  // ─── SLIDER NODE ───────────────────────────────────────────────────────────
  if (isSlider) {
    const trackRef = useRef<HTMLDivElement>(null);
    const { zoom, updateNodeDetails: updateDetails } = useCanvas();

    const minVal = node.details.sliderMin ?? 0;
    const maxVal = node.details.sliderMax ?? 100;
    const unit = node.details.sliderUnit ?? '';
    const value = node.details.sliderValue ?? minVal;

    const handleSliderMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDraggingSlider(true);

      const trackElement = trackRef.current;
      if (!trackElement) return;

      const rect = trackElement.getBoundingClientRect();
      const padding = 24;
      const width = rect.width - padding * 2;
      const initialValue = value;
      const startMouseX = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startMouseX) / zoom;
        const initialPercentage = (initialValue - minVal) / (maxVal - minVal);
        const initialX = initialPercentage * width;
        const currentX = Math.max(0, Math.min(width, initialX + dx));
        const newPercentage = currentX / width;
        const newValue = Math.round(minVal + newPercentage * (maxVal - minVal));
        updateDetails(node.id, { sliderValue: newValue });
      };

      const handleMouseUp = () => {
        setIsDraggingSlider(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const percentage = ((value - minVal) / (maxVal - minVal)) * 100;
    // leftOffset is relative to the track (which starts after the socket+gap)
    const leftOffset = `calc(24px + ${percentage}% - ${percentage * 0.48}px)`;
    const tooltipLabel = unit ? (unit === 'mm' ? `${value} ${unit}` : `${value}${unit}`) : value;

    return (
      <NodeWrapper node={node} icon={null} showHeader={false}>
        {/* Outer wrapper: [left spacer] [gap] [cell] [gap] [right socket] */}
        <div className="flex items-center relative select-none" style={{ gap: SOCKET_GAP, width: 392 }}>
          {/* Left spacer (no input socket on sliders, but keeps symmetry) */}
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />

          {/* Main slider track cell */}
          <div className="relative flex-1">
            {/* Tooltip bubble above thumb */}
            <div
              style={{ left: leftOffset }}
              className="absolute bottom-[calc(100%+6px)] -translate-x-1/2 bg-black text-white px-2.5 py-1 rounded-[8px] text-[13px] font-sans font-medium shadow-[0_4px_12px_rgba(0,0,0,0.6)] whitespace-nowrap z-20 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-black"
            >
              {tooltipLabel}
            </div>

            {/* Track */}
            <div
              ref={trackRef}
              onDoubleClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
              className={`relative w-full h-12 bg-zinc-800/80 border rounded-[12px] flex items-center px-6 shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-colors duration-150 cursor-pointer ${isSelected || isDraggingSlider ? 'border-white' : 'border-zinc-700/30 hover:border-white'
                }`}
            >
              {/* Dots */}
              <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white opacity-25" />
                ))}
              </div>

              {/* Thumb */}
              <div
                onMouseDown={handleSliderMouseDown}
                style={{ left: leftOffset, position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)' }}
                className={`w-5 h-9 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_2px_8px_rgba(0,0,0,0.4)] z-10 transition-colors ${isDraggingSlider ? 'bg-white' : 'bg-[#8a8a8f] hover:bg-white'
                  }`}
              >
                <div className="w-1.5 h-6 rounded-full bg-[#2b00ff]" />
              </div>
            </div>

            {/* Settings popup — right of cell */}
            {showSettings && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                className="absolute left-[calc(100%+16px)] top-0 w-[240px] bg-zinc-950/95 border border-zinc-800/85 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] p-4 flex flex-col gap-3.5 z-30 select-none text-left no-zoom"
              >
                <div className="flex justify-between items-center pb-1 border-b border-zinc-900">
                  <span className="text-[9px] font-trispace font-bold text-zinc-400 uppercase tracking-wider">Slider Settings</span>
                  <button onClick={(e) => { e.stopPropagation(); setShowSettings(false); }} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors cursor-pointer">✕</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[9px] font-trispace font-bold text-zinc-500 uppercase tracking-wider">Min</label>
                    <input type="number" value={node.details.sliderMin ?? 0}
                      onChange={(e) => { const v = parseInt(e.target.value); updateDetails(node.id, { sliderMin: isNaN(v) ? 0 : v }); }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-sans font-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[9px] font-trispace font-bold text-zinc-500 uppercase tracking-wider">Max</label>
                    <input type="number" value={node.details.sliderMax ?? 100}
                      onChange={(e) => { const v = parseInt(e.target.value); updateDetails(node.id, { sliderMax: isNaN(v) ? 0 : v }); }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-sans font-light [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-trispace font-bold text-zinc-500 uppercase tracking-wider">Unit</label>
                  <input type="text" value={node.details.sliderUnit ?? ''}
                    onChange={(e) => updateDetails(node.id, { sliderUnit: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 font-sans font-light"
                    placeholder="e.g. mm, %, °"
                  />
                </div>
                <div className="text-[9px] text-zinc-600 font-sans font-light border-t border-zinc-900/60 pt-2">Double-click track to toggle</div>
              </div>
            )}
          </div>

          {/* Right: output socket */}
          <div style={{ width: SOCKET_W, flexShrink: 0 }} className="flex items-center justify-center h-12">
            <Socket
              id={`${node.id}-port-out`}
              nodeId={node.id}
              name="value"
              type="output"
              dataType="raw"
              label=""
            />
          </div>
        </div>
      </NodeWrapper>
    );
  }

  // ─── IMAGE INPUT NODE ───────────────────────────────────────────────────────
  const isImageNode = node.type === 'ingress' && node.title.toLowerCase() === 'image';
  if (isImageNode) {
    return (
      <NodeWrapper node={node} icon={null} showHeader={false}>
        <div className="flex items-stretch" style={{ gap: SOCKET_GAP, width: 392 }}>
          {/* Left spacer */}
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />

          {/* Image card */}
          <div className="flex-1 bg-[#18181b]/95 border border-zinc-800/80 rounded-[20px] overflow-hidden relative shadow-[0_0_20px_rgba(255,255,255,0.06)] animate-fade-in-scale group">
            <img
              src="/xfigura_logo.jpeg"
              alt="Image input"
              className="w-full h-[200px] object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 flex items-center justify-between">
              <span className="text-zinc-300 font-trispace text-[10px] font-bold tracking-widest uppercase select-none">Image</span>
              <label className="text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" />
                <Image size={14} />
              </label>
            </div>
          </div>

          {/* Right: output socket */}
          <div style={{ width: SOCKET_W, flexShrink: 0 }} className="flex items-center justify-center">
            <Socket
              id={`${node.id}-port-out`}
              nodeId={node.id}
              name="output"
              type="output"
              dataType="raw"
              label=""
            />
          </div>
        </div>
      </NodeWrapper>
    );
  }

  // ─── OUTPUT IMAGE NODE ─────────────────────────────────────────────────────
  const isOutputNode = node.type === 'database' && node.title.toLowerCase() === 'output';
  if (isOutputNode) {
    return (
      <NodeWrapper node={node} icon={null} showHeader={false}>
        <div className="flex items-stretch" style={{ gap: SOCKET_GAP, width: 392 }}>
          {/* Left: input socket */}
          <div style={{ width: SOCKET_W, flexShrink: 0 }} className="flex items-center justify-center">
            <Socket
              id={`${node.id}-port-in`}
              nodeId={node.id}
              name="input"
              type="input"
              dataType="raw"
              label=""
            />
          </div>

          {/* Image card */}
          <div className="flex-1 bg-[#18181b]/95 border border-zinc-800/80 rounded-[20px] overflow-hidden relative shadow-[0_0_20px_rgba(255,255,255,0.06)] animate-fade-in-scale group">
            <img
              src="/hero.png"
              alt="Generated output"
              className="w-full h-[200px] object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 flex items-center justify-between">
              <span className="text-zinc-300 font-trispace text-[10px] font-bold tracking-widest uppercase select-none">Output Render</span>
              <button className="text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors">
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* Right spacer */}
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />
        </div>
      </NodeWrapper>
    );
  }

  // ─── GENERATED (non-generator) NODE ────────────────────────────────────────
  if (!isGenerator) {
    const inputs = node.details.generatedInputs || ['Image', 'Depth', 'Rotate', 'Roughness', 'Base Height'];

    return (
      <NodeWrapper node={node} icon={null} showHeader={false}>
        <div className="flex flex-col gap-3.5">
          {/* Card 1: Prompt text preview */}
          <div className="flex items-start" style={{ gap: SOCKET_GAP, width: 392 }}>
            {/* Left spacer */}
            <div style={{ width: SOCKET_W, flexShrink: 0 }} />

            {/* Cell */}
            <div
              className={`flex-1 bg-[#18181b]/95 rounded-[20px] flex flex-col relative transition-all duration-300 ${isPromptEditing
                ? 'min-h-[220px] overflow-visible z-auto border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.12)]'
                : 'backdrop-blur-md h-[110px] overflow-hidden z-0 border border-zinc-800/80 shadow-[0_0_20px_rgba(255,255,255,0.06)] group/card1 animate-fade-in-scale'
                }`}
            >
              <div className={`pt-5 pl-8 pr-8 relative flex flex-col gap-2 ${isPromptEditing ? 'pb-5' : 'pb-0'}`}>
                <button
                  onClick={() => {
                    if (isPromptEditing) { commitPromptEdit(); return; }
                    setText(node.details.generatedPrompt || defaultPrompt);
                    setShowDropdown(false); setDropdownSearch(''); setTriggerIdx(-1);
                    setIsPromptEditing(true);
                  }}
                  className={`absolute top-5 right-5 transition-all duration-150 p-1 cursor-pointer ${isPromptEditing
                    ? 'text-blue-400 hover:text-blue-300 opacity-100'
                    : 'text-zinc-400 hover:text-zinc-200 opacity-0 group-hover/card1:opacity-100'
                    }`}
                >
                  <Pencil size={14} className="stroke-[2px]" />
                </button>

                {isPromptEditing ? (
                  <div className={`rounded-xl p-4 min-h-[120px] transition-colors relative ${isFocused
                    ? 'bg-zinc-950/45 border border-zinc-800/80'
                    : 'bg-zinc-950/15 border border-zinc-950/10'
                    }`}>
                    <div id={`styled-text-${node.id}`} className="w-full min-h-[100px] text-zinc-300 font-sans text-xs leading-relaxed font-light whitespace-pre-wrap break-words pointer-events-none select-none overflow-hidden">
                      {showDropdown ? (
                        <>{renderFormattedText(text.substring(0, triggerIdx))}<span ref={triggerRef}>/</span>{renderFormattedText(text.substring(triggerIdx + 1))}</>
                      ) : renderFormattedText(text)}
                      {text.endsWith('/') && isFocused && <span className="text-zinc-500 animate-pulse">|</span>}
                    </div>
                    <textarea ref={textareaRef} value={text} onChange={handleTextareaChange} onKeyDown={handleKeyDown} onScroll={handleScroll}
                      onFocus={() => setIsFocused(true)} onBlur={() => { setTimeout(() => commitPromptEdit(), 200); }}
                      onWheel={(e) => e.stopPropagation()}
                      className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-zinc-200 resize-none outline-none border-none p-4 m-0 font-sans text-xs leading-relaxed font-light whitespace-pre-wrap break-words focus:ring-0 overflow-hidden"
                      placeholder="Type a prompt..."
                    />
                    {isFocused && showDropdown && filteredSuggestions.length > 0 && (
                      <div style={{ top: `${dropdownCoords.top}px`, left: `${dropdownCoords.left}px` }}
                        onWheel={(e) => e.stopPropagation()}
                        className="absolute w-[320px] mt-1.5 z-50 bg-zinc-950/95 border border-zinc-800/85 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] p-1.5 max-h-56 overflow-y-auto flex flex-col gap-0.5 no-zoom"
                      >
                        {filteredSuggestions.map((s, idx) => {
                          const sel = idx === selectedIdx;
                          const showHdr = idx === 0 || filteredSuggestions[idx].type !== filteredSuggestions[idx - 1].type;
                          return (
                            <React.Fragment key={s.name}>
                              {showHdr && <span className="text-[9px] font-trispace font-bold text-zinc-500 uppercase tracking-wider px-3 py-1.5 select-none mt-1 first:mt-0">{s.type}s</span>}
                              <div onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertSuggestion(s.name); }} onMouseEnter={() => setSelectedIdx(idx)}
                                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${sel ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'}`}
                              >
                                {getSuggestionIcon(s.icon)}
                                <div className="flex items-center gap-1">
                                  <span className="font-sans font-semibold text-zinc-200">{s.name}</span>
                                  <span className="text-[10px] text-zinc-500 font-light select-none">• {s.description}</span>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                        <div className="border-t border-zinc-900 mt-1.5 pt-1.5 px-3 pb-1 flex justify-between items-center text-[10px] text-zinc-500 select-none">
                          <span>Close menu</span><span className="font-mono text-[9px] bg-zinc-900/50 px-1 py-0.5 rounded">esc</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pr-8 text-zinc-400 font-sans text-xs leading-relaxed font-light select-none whitespace-pre-wrap break-words opacity-40">
                    {renderFormattedText(text)}
                  </div>
                )}
              </div>
            </div>

            {/* Right spacer */}
            <div style={{ width: SOCKET_W, flexShrink: 0 }} />
          </div>


          {/* Card 2: single bento card, sockets outside left border */}
          <div className="flex items-stretch" style={{ gap: SOCKET_GAP, width: 392 }}>
            {/* Left spacer */}
            <div style={{ width: SOCKET_W, flexShrink: 0 }} />

            {/* Bento card — one card holds all inputs. overflow-visible so sockets poke out */}
            <div className="flex-1 -mt-[60px] z-10 bg-[#18181b]/95 border border-zinc-800/80 rounded-[20px] p-3 flex flex-col relative shadow-[0_0_20px_rgba(255,255,255,0.08)] animate-card-slide-down origin-top overflow-visible">
              <div className="w-full bg-[#141416]/90 border border-zinc-900/60 rounded-[12px] pl-0 pr-5 py-4 flex flex-col gap-4 relative overflow-visible">
                {inputs.map((inputName) => (
                  <div key={inputName} className="relative flex items-center h-8">
                    {/* Socket — positioned in the left spacer column, outside outer card border */}
                    <div
                      className="absolute flex items-center justify-center"
                      style={{ left: -(12 + SOCKET_GAP + SOCKET_W / 2) }}
                    >
                      <Socket
                        id={`${node.id}-port-in-${inputName.toLowerCase().replace(/\s+/g, '-')}`}
                        nodeId={node.id}
                        name={inputName}
                        type="input"
                        dataType="raw"
                        label=""
                      />
                    </div>
                    {/* Label */}
                    <span className="ml-4 font-bold text-xs tracking-wide text-zinc-200">{inputName.toLowerCase()}</span>
                    <Pencil size={10} className="ml-1.5 text-zinc-500 hover:text-zinc-300 stroke-[2px] opacity-0 group-hover/input:opacity-100 transition-opacity duration-150" />
                  </div>
                ))}
              </div>

              {/* Output socket — outside right border, vertically centered */}
              <div className="absolute top-1/2 -translate-y-1/2" style={{ right: -(SOCKET_GAP + SOCKET_W) }}>
                <Socket
                  id={`${node.id}-port-out`}
                  nodeId={node.id}
                  name="output"
                  type="output"
                  dataType="raw"
                  label=""
                />
              </div>
            </div>

            {/* Right spacer */}
            <div style={{ width: SOCKET_W, flexShrink: 0 }} />
          </div>


          {/* Card 3: Controls toolbar */}
          <div className="flex items-center" style={{ gap: SOCKET_GAP, width: 392 }}>
            <div style={{ width: SOCKET_W, flexShrink: 0 }} />
            <div className="flex-1 bg-[#18181b]/95 backdrop-blur-md rounded-[20px] p-3 flex items-center justify-between border border-zinc-800/80 shadow-[0_0_20px_rgba(255,255,255,0.06)] animate-fade-in">
              <div className="h-10 px-5 rounded-[8px] border border-white/10 bg-white/5 backdrop-blur-md text-zinc-200 font-trispace text-xs font-normal tracking-wide select-none flex items-center justify-center">
                {node.details.generatedOutput || 'visualization'}
              </div>
              <div className="flex items-center gap-3">
                <button className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 cursor-pointer flex items-center justify-center h-10"><Download size={18} /></button>
                <button className="w-10 h-10 rounded-full bg-zinc-800/60 hover:bg-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800/40 cursor-pointer"><Settings size={16} /></button>
                <div className="relative">
                  {/* hint moved to bottom of node */}
                  <button
                    className="w-10 h-10 rounded-[8px] bg-[#2b00ff] overflow-hidden cursor-pointer transition-all border border-transparent flex items-center justify-center hover:scale-105 active:scale-95"
                    onMouseDown={dismissGenerateHint}
                    onFocus={dismissGenerateHint}
                    onClick={() => {
                      dismissGenerateHint();
                      const inputs = node.details.generatedInputs || ['Image', 'Depth', 'Rotate', 'Roughness', 'Base Height'];
                      const hasInputs = connections.some((c) => c.toNodeId === node.id);
                      if (!hasInputs) {
                        spawnInputNodes(node.id, node.x, node.y, inputs);
                      } else {
                        spawnOutputNode(node.id, node.x, node.y);
                      }
                    }}
                  >
                    <img src="/xfigura_logo.jpeg" className="w-5.5 h-5.5 object-contain" alt="xfigura logo" />
                  </button>
                </div>
              </div>
            </div>
            <div style={{ width: SOCKET_W, flexShrink: 0 }} />
          </div>
        </div>
      </NodeWrapper>
    );
  }

  // ─── LOADING / GENERATING STATE ─────────────────────────────────────────────
  if (isGenerating) {
    return (
      <NodeWrapper node={node} icon={null} showHeader={false}>
        <div className="flex items-center" style={{ gap: SOCKET_GAP, width: 392 }}>
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />
          <div className="flex-1 w-[360px] h-[220px] bg-[#18181b]/95 backdrop-blur-md rounded-[20px] border border-zinc-800/80 shadow-[0_0_30px_rgba(43,0,255,0.15)] flex flex-col items-center justify-center relative animate-fade-in-scale z-10 overflow-hidden">
            <div className="absolute w-24 h-24 rounded-full bg-[#2b00ff]/10 blur-xl pointer-events-none" />
            <div className="relative w-16 h-16 rounded-full border border-[#2b00ff]/55 bg-[#2b00ff] flex items-center justify-center shadow-[0_0_18px_rgba(43,0,255,0.35)] animate-spin-slow">
              <img src="/xfigura_logo.jpeg" className="w-9 h-9 rounded-full object-contain" alt="loading xfigura" />
            </div>
            <span className="mt-4 font-trispace text-[10px] font-bold text-zinc-400 tracking-widest uppercase animate-pulse select-none">Generating Node...</span>
          </div>
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />
        </div>
      </NodeWrapper>
    );
  }

  // ─── GENERATOR (prompt input) NODE ─────────────────────────────────────────
  return (
    <NodeWrapper node={node} icon={null} showHeader={false}>
      <div className="flex flex-col gap-3.5">
        {/* Card 1: Prompt text box */}
        <div className="flex items-start" style={{ gap: SOCKET_GAP, width: 392 }}>
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />

          <div className={`flex-1 bg-[#18181b]/95 backdrop-blur-md rounded-[20px] flex flex-col relative transition-all duration-300 ${isFocused
            ? 'border border-blue-500/80 shadow-[0_0_25px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/40 z-20'
            : isSelected
              ? 'border border-violet-500/80 shadow-[0_0_25px_rgba(139,92,246,0.25)] ring-1 ring-violet-500/40 z-10'
              : 'border border-zinc-800/80 shadow-[0_0_20px_rgba(255,255,255,0.06)] z-0'
            }`}>
            {/* Output socket on right of card 1 — centered vertically at ~80px */}
            <div className="absolute top-[80px] -right-[calc(var(--socket-gap,10px)+6px)] flex items-center justify-center" style={{ right: -(SOCKET_GAP + SOCKET_W) }}>
              <Socket
                id={`${node.id}-port-out`}
                nodeId={node.id}
                name="output"
                type="output"
                dataType="raw"
                label=""
              />
            </div>

            <div className="p-5 flex flex-col">
              <div className={`rounded-xl p-4 min-h-[120px] transition-colors relative ${isFocused
                ? 'bg-zinc-950/45 border border-zinc-800/80'
                : 'bg-zinc-950/15 border border-zinc-950/10'
                }`}>
                <div id={`styled-text-${node.id}`} className="w-full min-h-[100px] text-zinc-300 font-sans text-xs leading-relaxed font-light whitespace-pre-wrap break-words pointer-events-none select-none overflow-hidden">
                  {showDropdown ? (
                    <>{renderFormattedText(text.substring(0, triggerIdx))}<span ref={triggerRef}>/</span>{renderFormattedText(text.substring(triggerIdx + 1))}</>
                  ) : renderFormattedText(text)}
                  {text.endsWith('/') && isFocused && <span className="text-zinc-500 animate-pulse">|</span>}
                </div>
                <textarea ref={textareaRef} value={text} onChange={handleTextareaChange} onKeyDown={handleKeyDown} onScroll={handleScroll}
                  onFocus={() => setIsFocused(true)} onBlur={() => { setTimeout(() => setIsFocused(false), 200); }}
                  onWheel={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-zinc-200 resize-none outline-none border-none p-4 m-0 font-sans text-xs leading-relaxed font-light whitespace-pre-wrap break-words focus:ring-0 overflow-hidden"
                  placeholder="Type a prompt..."
                />
                {isFocused && showDropdown && filteredSuggestions.length > 0 && (
                  <div style={{ top: `${dropdownCoords.top}px`, left: `${dropdownCoords.left}px` }}
                    onWheel={(e) => e.stopPropagation()}
                    className="absolute w-[320px] mt-1.5 z-50 bg-zinc-950/95 border border-zinc-800/85 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] p-1.5 max-h-56 overflow-y-auto flex flex-col gap-0.5 no-zoom"
                  >
                    {filteredSuggestions.map((s, idx) => {
                      const sel = idx === selectedIdx;
                      const showHdr = idx === 0 || filteredSuggestions[idx].type !== filteredSuggestions[idx - 1].type;
                      return (
                        <React.Fragment key={s.name}>
                          {showHdr && <span className="text-[9px] font-trispace font-bold text-zinc-500 uppercase tracking-wider px-3 py-1.5 select-none mt-1 first:mt-0">{s.type}s</span>}
                          <div onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); insertSuggestion(s.name); }} onMouseEnter={() => setSelectedIdx(idx)}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${sel ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'}`}
                          >
                            {getSuggestionIcon(s.icon)}
                            <div className="flex items-center gap-1">
                              <span className="font-sans font-semibold text-zinc-200">{s.name}</span>
                              <span className="text-[10px] text-zinc-500 font-light select-none">• {s.description}</span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div className="border-t border-zinc-900 mt-1.5 pt-1.5 px-3 pb-1 flex justify-between items-center text-[10px] text-zinc-500 select-none">
                      <span>Close menu</span><span className="font-mono text-[9px] bg-zinc-900/50 px-1 py-0.5 rounded">esc</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ width: SOCKET_W, flexShrink: 0 }} />
        </div>

        {/* Card 2: Controls toolbar */}
        <div className="flex items-center" style={{ gap: SOCKET_GAP, width: 392 }}>
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />
          <div className="flex-1 bg-[#18181b]/95 backdrop-blur-md rounded-[20px] p-3 flex items-center justify-between border border-zinc-800/80 shadow-[0_0_20px_rgba(255,255,255,0.06)]">
            <div className="h-10 px-5 rounded-[8px] border border-white/10 bg-white/5 backdrop-blur-md text-zinc-200 font-trispace text-xs font-normal tracking-wide select-none flex items-center justify-center">
              text - to - node
            </div>
            <div className="flex items-center gap-3">
              <button className="text-zinc-400 hover:text-zinc-200 transition-colors p-2 cursor-pointer flex items-center justify-center h-10"><Download size={18} /></button>
              <button className="w-10 h-10 rounded-full bg-zinc-800/60 hover:bg-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800/40 cursor-pointer"><Settings size={16} /></button>
              <div className="relative">
                <button
                  onMouseDown={dismissGenerateHint}
                  onFocus={dismissGenerateHint}
                  onClick={() => {
                    dismissGenerateHint();
                    setIsGenerating(true);
                    setTimeout(() => {
                      const parsed = parsePrompt(text);
                      addGeneratedNode(parsed.inputs, parsed.output, text);
                      setIsGenerating(false);
                    }, 1400);
                  }}
                  className="w-10 h-10 rounded-[8px] bg-[#2b00ff] overflow-hidden cursor-pointer transition-all border border-transparent flex items-center justify-center hover:bg-[#3d14ff]"
                >
                  <img src="/xfigura_logo.jpeg" className="w-5.5 h-5.5 object-contain" alt="xfigura logo" />
                </button>
                {showGenerateHint && (
                  <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-3 z-30 flex flex-col items-center gap-2">
                    <img src="/assets/logos/click.png" className="w-[148px] h-[148px] object-contain animate-pulse" alt="" />
                    <span className="text-[24px] font-sans font-bold text-zinc-200 whitespace-nowrap">Click here !</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ width: SOCKET_W, flexShrink: 0 }} />
        </div>
      </div>
    </NodeWrapper>
  );
};

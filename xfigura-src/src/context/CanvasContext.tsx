import React, { createContext, useContext, useState, useCallback } from 'react';
import type { NodeData, Connection, Vector2D, NodeType, PortType } from '../types/canvas';

interface SocketRegistryInfo {
  nodeId: string;
  rx: number; // relative X offset inside node
  ry: number; // relative Y offset inside node
  type: PortType;
  dataType: string;
}

interface CanvasContextType {
  nodes: NodeData[];
  connections: Connection[];
  pan: Vector2D;
  zoom: number;
  selectedNodeId: string | null;
  socketOffsets: Record<string, SocketRegistryInfo>;
  connecting: {
    nodeId: string;
    portId: string;
    portType: PortType;
    dataType: 'http' | 'grpc' | 'sql' | 'event' | 'stream' | 'raw';
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
  
  setPan: React.Dispatch<React.SetStateAction<Vector2D>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setSelectedNodeId: (id: string | null) => void;
  
  registerSocket: (socketId: string, nodeId: string, rx: number, ry: number, type: PortType, dataType: any) => void;
  unregisterSocket: (socketId: string) => void;
  
  updateNodePosition: (nodeId: string, x: number, y: number) => void;
  updateNodeDetails: (nodeId: string, details: Partial<NodeData['details']>) => void;
  updateNodeTitle: (nodeId: string, title: string) => void;
  startConnecting: (nodeId: string, portId: string, portType: PortType, dataType: any, startX: number, startY: number) => void;
  updateConnecting: (x: number, y: number) => void;
  stopConnecting: (targetNodeId?: string, targetPortId?: string) => void;
  
  addConnection: (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string, dataType: any) => void;
  removeConnection: (id: string) => void;
  addNode: (type: NodeType, x: number, y: number) => void;
  addGeneratedNode: (inputs: string[], output: string, promptText: string) => void;
  spawnInputNodes: (vizNodeId: string, vizNodeX: number, vizNodeY: number, inputs: string[]) => void;
  spawnOutputNode: (vizNodeId: string, vizNodeX: number, vizNodeY: number) => void;
  centerOnNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  resetCanvas: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

const CANVAS_CENTER = { x: 2500, y: 2500 };
const DEFAULT_ZOOM = 0.76;
const NODE_W = 392;
const COL_GAP = 120; // horizontal wire runway between columns

const getCenteredPan = (nodeX: number, nodeY: number, zoom: number) => {
  const isEmbed = typeof window !== 'undefined' && (window.self !== window.top || window.location.search.includes('embed'));
  const containerWidth = typeof window !== 'undefined' 
    ? (isEmbed ? window.innerWidth : Math.min(1192, window.innerWidth - 48)) 
    : 1192;
  const containerHeight = typeof window !== 'undefined'
    ? (isEmbed ? window.innerHeight : 600)
    : 600;
  return {
    x: containerWidth / 2 - nodeX * zoom,
    y: containerHeight / 2 - nodeY * zoom,
  };
};



const SLIDER_DEFAULTS: Record<string, { value: number; min: number; max: number; unit: string }> = {
  depth:         { value: 20, min: 0, max: 50,  unit: 'mm' },
  rotate:        { value: 44, min: 0, max: 90,  unit: '°' },
  roughness:     { value: 70, min: 0, max: 100, unit: '%' },
  'base height': { value: 5,  min: 0, max: 10,  unit: "'" },
};

const INITIAL_NODES: NodeData[] = [
  {
    id: 'node-generator',
    type: 'service',
    x: CANVAS_CENTER.x - 1220,
    y: CANVAS_CENTER.y - 160,
    title: 'Prompt Generator',
    status: 'online',
    metrics: {},
    details: {}
  }
];

const INITIAL_CONNECTIONS: Connection[] = [];

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  // Center generator node in the viewport
  const [pan, setPan] = useState<Vector2D>(() =>
    getCenteredPan(CANVAS_CENTER.x - 1220, CANVAS_CENTER.y - 160, DEFAULT_ZOOM)
  );
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Track port relative positions inside nodes
  const [socketOffsets, setSocketOffsets] = useState<Record<string, SocketRegistryInfo>>({});
  
  // Active dragging connection
  const [connecting, setConnecting] = useState<CanvasContextType['connecting']>(null);

  const registerSocket = useCallback((
    socketId: string,
    nodeId: string,
    rx: number,
    ry: number,
    type: PortType,
    dataType: any
  ) => {
    setSocketOffsets((prev) => ({
      ...prev,
      [socketId]: { nodeId, rx, ry, type, dataType }
    }));
  }, []);

  const unregisterSocket = useCallback((socketId: string) => {
    setSocketOffsets((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }, []);

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, x, y } : node))
    );
  }, []);

  const updateNodeDetails = useCallback((nodeId: string, details: Partial<NodeData['details']>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? { ...node, details: { ...node.details, ...details } }
          : node
      )
    );
  }, []);

  const updateNodeTitle = useCallback((nodeId: string, title: string) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, title } : node))
    );
  }, []);

  const startConnecting = useCallback((
    nodeId: string,
    portId: string,
    portType: PortType,
    dataType: any,
    startX: number,
    startY: number
  ) => {
    setConnecting({
      nodeId,
      portId,
      portType,
      dataType,
      startX,
      startY,
      currentX: startX,
      currentY: startY
    });
  }, []);

  const updateConnecting = useCallback((x: number, y: number) => {
    setConnecting((prev) => {
      if (!prev) return null;
      return { ...prev, currentX: x, currentY: y };
    });
  }, []);

  const addConnection = useCallback((
    fromNodeId: string,
    fromPortId: string,
    toNodeId: string,
    toPortId: string,
    dataType: any
  ) => {
    // Avoid duplicates
    setConnections((prev) => {
      const exists = prev.some(
        (c) =>
          c.fromPortId === fromPortId &&
          c.toPortId === toPortId
      );
      if (exists) return prev;
      
      const newConn: Connection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fromNodeId,
        fromPortId,
        toNodeId,
        toPortId,
        dataType
      };
      return [...prev, newConn];
    });
  }, []);

  const stopConnecting = useCallback((targetNodeId?: string, targetPortId?: string) => {
    if (connecting && targetNodeId && targetPortId) {
      const isOutputSource = connecting.portType === 'output';
      const fromNodeId = isOutputSource ? connecting.nodeId : targetNodeId;
      const fromPortId = isOutputSource ? connecting.portId : targetPortId;
      const toNodeId = isOutputSource ? targetNodeId : connecting.nodeId;
      const toPortId = isOutputSource ? targetPortId : connecting.portId;
      
      // Look up target data type if possible
      const targetSocket = socketOffsets[targetPortId];
      const dataType = targetSocket ? targetSocket.dataType : connecting.dataType;
      
      addConnection(fromNodeId, fromPortId, toNodeId, toPortId, dataType as any);
    }
    setConnecting(null);
  }, [connecting, addConnection, socketOffsets]);

  const removeConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addNode = useCallback((type: NodeType, x: number, y: number) => {
    const id = `node-${type}-${Date.now()}`;
    const titles: Record<NodeType, string> = {
      ingress: 'Ingress Client',
      gateway: 'API Gateway',
      service: 'Microservice',
      queue: 'Event Stream',
      database: 'Database Store',
      slider: 'Slider'
    };
    
    const defaultDetails = (nodeType: NodeType) => {
      switch (nodeType) {
        case 'ingress':
          return { targetService: 'API Gateway' };
        case 'gateway':
          return {
            pathPattern: '/api/v2/*',
            rateLimit: '500 req/sec',
            slashCommands: [{ command: '/proxy', desc: 'Proxy to microservice', accent: 'cyan' as const }]
          };
        case 'service':
          return { env: 'staging', version: 'v1.0.0', endpoints: ['GET /health', 'POST /submit'] };
        case 'queue':
          return { topics: ['stream-events'], consumers: 1 };
        case 'database':
          return { dbType: 'Redis Cache', replicaState: 'standalone' };
        case 'slider':
          return { sliderValue: 20, sliderMin: 0, sliderMax: 50, sliderUnit: 'mm' };
      }
    };

    const defaultMetrics = (nodeType: NodeType): NodeData['metrics'] => {
      switch (nodeType) {
        case 'ingress': return { throughput: 150 };
        case 'gateway': return { cpu: 5, memory: '256 MB', latency: 2 };
        case 'service': return { cpu: 12, memory: '340 MB', latency: 8 };
        case 'queue': return { throughput: 300 };
        case 'database': return { connections: 12, storage: 15, latency: 1 };
        case 'slider': return {};
      }
    };

    const newNode: NodeData = {
      id,
      type,
      x,
      y,
      title: `${titles[type]} #${Math.floor(100 + Math.random() * 900)}`,
      status: 'online',
      metrics: defaultMetrics(type),
      details: defaultDetails(type) ?? {}
    };

    setNodes((prev) => [...prev, newNode]);
  }, []);

  const centerOnNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (node) {
        setPan(getCenteredPan(node.x + 196, node.y + 200, zoom));
      }
      return currentNodes;
    });
  }, [zoom]);

  const addGeneratedNode = useCallback((inputs: string[], output: string, promptText: string) => {
    const id = `node-generated-${Date.now()}`;
    const newNode: NodeData = {
      id,
      type: 'gateway',
      x: CANVAS_CENTER.x - 196,
      y: CANVAS_CENTER.y - 160,
      title: 'Generated Component',
      status: 'online',
      metrics: {},
      details: {
        generatedInputs: inputs,
        generatedOutput: output,
        generatedPrompt: promptText
      }
    };
    setNodes((prev) => prev.filter((n) => n.id !== 'node-generator').concat(newNode));
    setSelectedNodeId(id);

    // Auto-focus on the newly generated node
    setTimeout(() => {
      centerOnNode(id);
    }, 100);
  }, [centerOnNode]);

  const spawnInputNodes = useCallback((
    vizNodeId: string,
    vizNodeX: number,
    vizNodeY: number,
    inputs: string[]
  ) => {
    const inputX = vizNodeX - NODE_W - COL_GAP;
    const vizNodeH = 412; // estimated height of central Visualization Node

    let totalH = 0;
    inputs.forEach((inputName, idx) => {
      const isImage = inputName.toLowerCase() === 'image';
      const nodeH = isImage ? 200 : 48;
      totalH += nodeH;
      if (idx > 0) totalH += 20; // 20px padding between nodes
    });

    const startY = vizNodeY + (vizNodeH - totalH) / 2;

    const newNodes: NodeData[] = [];
    const newConns: Connection[] = [];
    const ts = Date.now();
    let currentY = startY;

    inputs.forEach((inputName, idx) => {
      const isImage = inputName.toLowerCase() === 'image';
      const newId = `node-${isImage ? 'image' : 'slider'}-${ts}-${idx}`;
      const nodeH = isImage ? 200 : 48;

      const yPos = currentY;
      currentY = yPos + nodeH + 20; // 20px padding between nodes

      const key = inputName.toLowerCase();
      const sd = SLIDER_DEFAULTS[key] || { value: 0, min: 0, max: 100, unit: '' };

      newNodes.push({
        id: newId,
        type: isImage ? 'ingress' : 'slider',
        x: inputX,
        y: yPos,
        title: inputName,
        status: 'online',
        metrics: {},
        details: isImage
          ? { targetService: inputName }
          : { sliderValue: sd.value, sliderMin: sd.min, sliderMax: sd.max, sliderUnit: sd.unit }
      });

      newConns.push({
        id: `conn-spawn-${ts}-${idx}`,
        fromNodeId: newId,
        fromPortId: `${newId}-port-out`,
        toNodeId: vizNodeId,
        toPortId: `${vizNodeId}-port-in-${inputName.toLowerCase().replace(/\s+/g, '-')}`,
        dataType: 'raw'
      });
    });

    setNodes((prev) => {
      const alreadyHasInputs = prev.some((n) => n.id.includes('-image-') || n.id.includes('-slider-'));
      if (alreadyHasInputs) return prev;
      return [...prev, ...newNodes];
    });

    setConnections((prevConns) => {
      if (prevConns.some((c) => c.toNodeId === vizNodeId)) return prevConns;
      return [...prevConns, ...newConns];
    });

    // Pan to center the full dispersed graph (both columns)
    setTimeout(() => {
      const midX = inputX + NODE_W + COL_GAP / 2;
      const midY = vizNodeY + vizNodeH / 2;
      setPan(getCenteredPan(midX, midY, zoom));
    }, 200);

  }, [zoom]);

  const spawnOutputNode = useCallback((
    vizNodeId: string,
    vizNodeX: number,
    vizNodeY: number
  ) => {
    const outputX = vizNodeX + NODE_W + COL_GAP;
    const vizNodeH = 412; // estimated height of central Visualization Node
    const outputNodeH = 200; // estimated height of output image node
    const yPos = vizNodeY + (vizNodeH - outputNodeH) / 2;
    const ts = Date.now();
    const newId = `node-output-${ts}`;

    const newNode: NodeData = {
      id: newId,
      type: 'database',
      x: outputX,
      y: yPos,
      title: 'Output',
      status: 'online',
      metrics: {},
      details: {}
    };

    const newConn: Connection = {
      id: `conn-output-${ts}`,
      fromNodeId: vizNodeId,
      fromPortId: `${vizNodeId}-port-out`,
      toNodeId: newId,
      toPortId: `${newId}-port-in`,
      dataType: 'raw'
    };

    setNodes((prev) => {
      const alreadyHasOutput = prev.some((n) => n.id.includes('-output-'));
      if (alreadyHasOutput) return prev;
      return [...prev, newNode];
    });

    setConnections((prevConns) => {
      if (prevConns.some((c) => c.fromNodeId === vizNodeId && c.fromPortId === `${vizNodeId}-port-out`)) {
        return prevConns;
      }
      return [...prevConns, newConn];
    });

    // Pan to center the entire graph including the new output node
    setTimeout(() => {
      const midX = vizNodeX + 196;
      const midY = vizNodeY + vizNodeH / 2;
      setPan(getCenteredPan(midX, midY, zoom));
    }, 200);

  }, [zoom]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    // Clean up connections associated with this node
    setConnections((prev) =>
      prev.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId)
    );
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  const resetCanvas = useCallback(() => {
    setNodes(INITIAL_NODES);
    setConnections(INITIAL_CONNECTIONS);
    setPan(getCenteredPan(CANVAS_CENTER.x - 1220, CANVAS_CENTER.y - 160, DEFAULT_ZOOM));
    setZoom(DEFAULT_ZOOM);
    setSelectedNodeId(null);
    setConnecting(null);
  }, []);

  return (
    <CanvasContext.Provider
      value={{
        nodes,
        connections,
        pan,
        zoom,
        selectedNodeId,
        socketOffsets,
        connecting,
        setPan,
        setZoom,
        setSelectedNodeId,
        registerSocket,
        unregisterSocket,
        updateNodePosition,
        updateNodeDetails,
        updateNodeTitle,
        startConnecting,
        updateConnecting,
        stopConnecting,
        addConnection,
        removeConnection,
        addNode,
        addGeneratedNode,
        spawnInputNodes,
        spawnOutputNode,
        centerOnNode,
        deleteNode,
        resetCanvas
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};

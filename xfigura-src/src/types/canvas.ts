export type NodeType = 'ingress' | 'gateway' | 'service' | 'queue' | 'database' | 'slider';

export interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  title: string;
  status: 'online' | 'warning' | 'offline';
  metrics: {
    cpu?: number;        // percentage
    memory?: string | number; // e.g., '1.2 GB' or 480
    latency?: number;    // ms
    throughput?: number; // req/sec or events/sec
    storage?: number;    // percentage
    connections?: number;
  };
  details: {
    pathPattern?: string;
    rateLimit?: string;
    endpoints?: string[];
    env?: string;
    version?: string;
    topics?: string[];
    consumers?: number;
    dbType?: string;
    replicaState?: string;
    targetService?: string;
    slashCommands?: { command: string; desc: string; accent: 'violet' | 'cyan' }[];
    generatedInputs?: string[];
    generatedOutput?: string;
    generatedPrompt?: string;
    sliderValue?: number;
    sliderUnit?: string;
    sliderMin?: number;
    sliderMax?: number;
  };
}

export type PortType = 'input' | 'output';

export interface PortData {
  id: string;
  nodeId: string;
  name: string;
  type: PortType;
  dataType: 'http' | 'grpc' | 'sql' | 'event' | 'stream' | 'raw';
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  dataType: 'http' | 'grpc' | 'sql' | 'event' | 'stream' | 'raw';
}

export interface Vector2D {
  x: number;
  y: number;
}

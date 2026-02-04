export interface InjectionRequest {
  text: string;
  priority?: number;
}

export interface QueuedInjection {
  text: string;
  priority: number;
  timestamp: number;
}

export interface HealthResponse {
  status: "ok";
  version: string;
  editor: string;
}

export interface StatusResponse {
  idle: boolean;
  queueLength: number;
  chatOpen: boolean;
}

export interface InjectResponse {
  queued: boolean;
  queueLength: number;
}

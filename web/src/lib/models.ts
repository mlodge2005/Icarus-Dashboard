export type Protocol = {
  _id: string;
  name: string;
  trigger: "manual" | "schedule" | "event";
  objective: string;
  steps: string[];
  approvalsRequired: boolean;
};

export type ProtocolRun = {
  _id: string;
  protocolId: string;
  status: "queued" | "running" | "success" | "failed";
  startedAt: string;
  endedAt?: string;
  output?: string;
  error?: string;
};

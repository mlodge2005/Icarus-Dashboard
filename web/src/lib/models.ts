export type Protocol = {
  _id: string;
  name: string;
  trigger: "manual" | "schedule" | "event";
  objective: string;
  steps: string[];
  approvalsRequired: boolean;
  active?: boolean;
  definitionOfDone?: string;
  requiredInputs?: string[];
  templateCategory?: string;
  allowNoInput?: boolean;
  scheduleEnabled?: boolean;
  scheduleMode?: "interval" | "weekly";
  scheduleIntervalMinutes?: number;
  scheduleWeekday?: "sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat";
  scheduleTime?: string;
  scheduleTimezone?: string;
  lastScheduledRunAt?: string;
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

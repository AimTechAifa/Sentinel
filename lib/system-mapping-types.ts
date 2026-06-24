export type MappingEdgeRow = {
  id?: string;
  sourceAppId: string;
  sourceEnvId: string;
  targetAppId: string;
  targetEnvId: string;
  direction: string;
  notes?: string | null;
  sourceApp?: { name: string };
  sourceEnv?: { name: string };
  targetApp?: { name: string };
  targetEnv?: { name: string };
};

export type MappingGroupRow = {
  id: string;
  name: string;
  status: string;
  sourceNotes: string | null;
  createdAt: string;
  updatedAt: string;
  edges: MappingEdgeRow[];
};

export type ResolvedSuggestion = {
  sourceApp: string;
  sourceEnv: string;
  targetApp: string;
  targetEnv: string;
  direction: string;
  notes?: string;
  sourceAppId: string;
  sourceEnvId: string;
  targetAppId: string;
  targetEnvId: string;
};

export type MappingRisk = {
  edgeId: string;
  groupId: string | null;
  groupName: string | null;
  source: string;
  target: string;
  direction: string;
  notes: string | null;
  risk: string;
  bookedBy: string;
  team: string;
  fromDate: string;
  toDate: string;
  purpose?: string | null;
  conflictEnv: string;
};

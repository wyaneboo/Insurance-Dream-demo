export type CrudResource = 'prospect' | 'pipeline';
export type CrudOperation = 'list' | 'get' | 'create' | 'update' | 'delete';

export type AgentAction = {
  resource?: CrudResource;
  operation?: CrudOperation;
  id?: string;
  lookupName?: string;
  fields?: string[];
  data?: Record<string, unknown>;
  // Set by the Python repair node: re-run with the backend's default field set.
  useDefaultFields?: boolean;
};

export type ToolExecution = {
  result: unknown;
  fields: string[];
};

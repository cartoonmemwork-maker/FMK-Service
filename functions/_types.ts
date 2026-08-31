export type D1Result<Row = Record<string, unknown>> = {
  success: boolean;
  results: Row[];
};

export type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
};

export type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: <Row = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ) => Promise<D1Result<Row>[]>;
};

export type Environment = {
  DB?: D1Database;
  ANALYTICS_PASSWORD?: string;
};

export type FunctionContext = {
  request: Request;
  env: Environment;
  next: () => Promise<Response>;
};

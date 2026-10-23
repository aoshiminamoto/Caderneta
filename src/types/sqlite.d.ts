declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string, options?: unknown);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
  export type StatementSync = {
    run(...params: unknown[]): { lastInsertRowid: number; changes: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

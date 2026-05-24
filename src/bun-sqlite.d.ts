declare module "bun:sqlite" {
  export class Database {
    constructor(filename: string, options?: any);
    run(sql: string, ...params: any[]): any;
    query(sql: string): {
      all(...params: any[]): any[];
      get(...params: any[]): any;
      run(...params: any[]): any;
    };
    prepare(sql: string): {
      run(...params: any[]): any;
      all(...params: any[]): any[];
      get(...params: any[]): any;
    };
    transaction(fn: (...args: any[]) => any): (...args: any[]) => any;
  }
}

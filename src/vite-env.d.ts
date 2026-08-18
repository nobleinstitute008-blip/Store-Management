/// <reference types="vite/client" />

declare module '*.wasm?url' {
  const content: string;
  export default content;
}

declare module 'sql.js/dist/sql-asm.js' {
  import { InitSqlJsStatic } from 'sql.js';
  const initSqlJs: InitSqlJsStatic;
  export default initSqlJs;
}

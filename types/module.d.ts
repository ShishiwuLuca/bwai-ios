declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const Component: DefineComponent<object, object, never>;
  export default Component;
}

declare module 'virtual:*' {
  const result: never;
  export default result;
}

declare module 'archiver' {
  interface Archiver {
    pointer(): number;
    on(event: string, handler: (...args: unknown[]) => void): Archiver;
    pipe(dest: NodeJS.WritableStream): unknown;
    directory(dir: string, opts?: { name?: string } | boolean): void;
    finalize(): Promise<void>;
  }
  export class ZipArchive extends Archiver {
    constructor(options?: Record<string, unknown>);
  }
}

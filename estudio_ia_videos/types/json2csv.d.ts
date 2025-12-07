declare module 'json2csv' {
  export interface ParserOptions {
    delimiter?: string;
    eol?: string;
    header?: boolean;
    fields?: string[] | { label: string; value: string; default?: string }[];
    transforms?: ((item: unknown) => unknown)[];
  }

  export class Parser<T = unknown> {
    constructor(options?: ParserOptions);
    parse(data: T | T[]): string;
  }
}

declare module 'formidable' {
  import { IncomingMessage } from 'http';

  interface FormidableOptions {
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFileSize?: number;
    maxFieldsSize?: number;
    multiples?: boolean;
    allowEmptyFiles?: boolean;
  }

  interface File {
    size: number;
    path: string;
    name: string;
    type: string;
    lastModifiedDate?: Date;
  }

  interface Fields {
    [key: string]: string | string[];
  }

  interface Files {
    [key: string]: File | File[];
  }

  interface IncomingForm {
    parse(
      req: IncomingMessage,
      callback?: (err: Error | null, fields: Fields, files: Files) => void
    ): void;
  }

  export default function formidable(options?: FormidableOptions): IncomingForm;
  export { File, Fields, Files, FormidableOptions, IncomingForm };
}

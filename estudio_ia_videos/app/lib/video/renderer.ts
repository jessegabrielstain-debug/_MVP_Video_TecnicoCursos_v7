export interface RenderProgress {
  percent: number;
  message: string;
  currentFile: string;
  totalFiles: number;
  estimatedTimeLeft: number;
}

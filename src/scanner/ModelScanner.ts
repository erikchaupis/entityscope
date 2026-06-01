import { DomainModel } from '../model/types';

export interface ScanContext {
  workspaceRoot: string;
  /** Absolute paths to scan; defaults to entire workspace */
  sourcePaths?: string[];
}

export interface ModelScanner {
  scan(context: ScanContext): Promise<DomainModel>;
}

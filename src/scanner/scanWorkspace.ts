import * as vscode from 'vscode';
import { DomainModel } from '../model/types';
import { getScannerForProject } from './JpaScanner';

export async function scanWorkspace(): Promise<DomainModel | null> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return null;
  }

  const scanner = getScannerForProject(workspaceFolder.uri.fsPath);
  return scanner.scan({ workspaceRoot: workspaceFolder.uri.fsPath });
}

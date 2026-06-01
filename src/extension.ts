import * as vscode from 'vscode';
import {
  EntityViewerPanel,
  extractEntityNameFromFile,
  getEntityNameFromActiveEditor,
} from './webview/EntityViewerPanel';
import { PackageTreeProvider } from './views/PackageTreeProvider';

let packageTreeProvider: PackageTreeProvider | undefined;

function resolveSelectEntity(
  arg?: vscode.Uri | string
): Promise<string | undefined> {
  if (typeof arg === 'string') {
    return Promise.resolve(arg);
  }
  if (arg instanceof vscode.Uri) {
    return extractEntityNameFromFile(arg.fsPath);
  }
  return Promise.resolve(undefined);
}

export function activate(context: vscode.ExtensionContext) {
  packageTreeProvider = new PackageTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('entityViewer.packages', packageTreeProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('entityViewer.open', async (arg?: vscode.Uri | string) => {
      const selectEntity = await resolveSelectEntity(arg);
      EntityViewerPanel.createOrShow(context.extensionUri, selectEntity);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('entityViewer.refresh', async () => {
      await packageTreeProvider?.refresh();
      if (EntityViewerPanel.currentPanel) {
        await EntityViewerPanel.currentPanel.scan();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('entityViewer.focusCurrent', () => {
      const entityName = getEntityNameFromActiveEditor();
      if (!entityName) {
        vscode.window.showWarningMessage('Current file is not a recognized entity.');
        return;
      }
      EntityViewerPanel.createOrShow(context.extensionUri, entityName);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      void packageTreeProvider?.refresh();
    })
  );

  if (vscode.workspace.workspaceFolders?.length) {
    void packageTreeProvider.loadModel();
  }
}

export function deactivate() {
  EntityViewerPanel.currentPanel?.dispose();
  packageTreeProvider = undefined;
}

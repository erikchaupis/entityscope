import * as vscode from 'vscode';
import { DomainModelJson, toJson } from '../model/types';
import { getScannerForProject } from '../scanner/JpaScanner';

export class EntityViewerPanel {
  public static currentPanel: EntityViewerPanel | undefined;
  public static readonly viewType = 'entityViewer';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private lastModel: DomainModelJson | null = null;
  private selectEntityName: string | undefined;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(this.handleMessage.bind(this), null, this.disposables);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => this.sendTheme())
    );
  }

  public static createOrShow(extensionUri: vscode.Uri, selectEntity?: string) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (EntityViewerPanel.currentPanel) {
      EntityViewerPanel.currentPanel.panel.reveal(column);
      if (selectEntity) {
        EntityViewerPanel.currentPanel.selectEntity(selectEntity);
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      EntityViewerPanel.viewType,
      'EntityScope',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
          vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist'),
        ],
      }
    );

    EntityViewerPanel.currentPanel = new EntityViewerPanel(panel, extensionUri);
    if (selectEntity) {
      EntityViewerPanel.currentPanel.selectEntity(selectEntity);
    }
    EntityViewerPanel.currentPanel.scan();
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    EntityViewerPanel.currentPanel = new EntityViewerPanel(panel, extensionUri);
  }

  public async scan() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this.postMessage({ type: 'error', message: 'No workspace folder open' });
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'EntityScope',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Scanning JPA entities...' });
        const scanner = getScannerForProject(workspaceFolder.uri.fsPath);
        const model = await scanner.scan({ workspaceRoot: workspaceFolder.uri.fsPath });
        this.lastModel = toJson(model);
        this.postMessage({ type: 'model', data: this.lastModel });
        if (this.selectEntityName) {
          this.postMessage({ type: 'selectEntity', entityName: this.selectEntityName });
          this.selectEntityName = undefined;
        }
      }
    );
  }

  public selectEntity(entityName: string) {
    this.selectEntityName = entityName;
    if (this.lastModel) {
      this.postMessage({ type: 'selectEntity', entityName });
      this.selectEntityName = undefined;
    }
  }

  private async handleMessage(message: { type: string; [key: string]: unknown }) {
    switch (message.type) {
      case 'ready':
        this.sendTheme();
        if (this.lastModel) {
          this.postMessage({ type: 'model', data: this.lastModel });
        } else {
          await this.scan();
        }
        break;
      case 'refresh':
        await this.scan();
        break;
      case 'openFile':
        if (typeof message.filePath === 'string') {
          const uri = vscode.Uri.file(message.filePath);
          await vscode.window.showTextDocument(uri);
        }
        break;
      case 'openEntity':
        if (typeof message.entityName === 'string' && this.lastModel) {
          const entity = this.lastModel.entities.find((e) => e.name === message.entityName);
          if (entity?.filePath) {
            const uri = vscode.Uri.file(entity.filePath);
            await vscode.window.showTextDocument(uri);
          }
        }
        break;
    }
  }

  private postMessage(message: unknown) {
    this.panel.webview.postMessage(message);
  }

  private sendTheme() {
    this.postMessage({ type: 'theme', theme: resolveAppTheme() });
  }

  private getHtml(): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'dist', 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'dist', 'assets', 'index.css')
    );

    const nonce = getNonce();
    const initialTheme = 'cursor-light';

    return `<!DOCTYPE html>
<html lang="en" data-theme="${initialTheme}">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>EntityScope</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    EntityViewerPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

type AppTheme = 'graphite-dark' | 'cursor-light' | 'cursor-dark';

function resolveAppTheme(): AppTheme {
  const kind = vscode.window.activeColorTheme.kind;
  const themeName = vscode.workspace
    .getConfiguration('workbench')
    .get<string>('colorTheme', '')
    .toLowerCase();

  if (
    (kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast) &&
    (themeName.includes('cursor') || themeName.includes('github dark'))
  ) {
    return 'cursor-dark';
  }

  if (
    (kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast) &&
    themeName.includes('graphite')
  ) {
    return 'graphite-dark';
  }

  return 'cursor-light';
}

export async function extractEntityNameFromFile(filePath: string): Promise<string | undefined> {
  const fs = await import('fs');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!/@Entity\b/.test(content)) {
      return undefined;
    }
    const classMatch = content.match(/class\s+(\w+)/);
    return classMatch ? classMatch[1] : undefined;
  } catch {
    return undefined;
  }
}

export function getEntityNameFromActiveEditor(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !editor.document.fileName.endsWith('.java')) {
    return undefined;
  }
  const content = editor.document.getText();
  if (!/@Entity\b/.test(content)) {
    return undefined;
  }
  const classMatch = content.match(/class\s+(\w+)/);
  return classMatch ? classMatch[1] : undefined;
}

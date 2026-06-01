import * as vscode from 'vscode';
import { getTopLevelPackage } from '../lib/packageKey';
import { DomainModel, EntityModel } from '../model/types';
import { scanWorkspace } from '../scanner/scanWorkspace';

export type PackageTreeItemType = 'open-graph' | 'package' | 'entity' | 'message';

export class PackageTreeItem extends vscode.TreeItem {
  constructor(
    public readonly nodeType: PackageTreeItemType,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }

  entity?: EntityModel;
  packageKey?: string;
}

export class PackageTreeProvider implements vscode.TreeDataProvider<PackageTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<PackageTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private model: DomainModel | null = null;
  private loading = false;

  refresh(): Thenable<void> {
    return this.loadModel(true);
  }

  async loadModel(fireChange = true): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = true;
    try {
      this.model = await scanWorkspace();
      if (fireChange) {
        this._onDidChangeTreeData.fire(undefined);
      }
    } finally {
      this.loading = false;
    }
  }

  getTreeItem(element: PackageTreeItem): vscode.TreeItem {
    if (element.nodeType === 'open-graph') {
      element.iconPath = new vscode.ThemeIcon('type-hierarchy');
      element.description = 'Open domain graph';
      element.command = {
        command: 'entityViewer.open',
        title: 'Open Domain Model',
      };
      element.contextValue = 'openGraph';
      return element;
    }

    if (element.nodeType === 'package') {
      element.iconPath = new vscode.ThemeIcon('folder');
      element.contextValue = 'package';
      return element;
    }

    if (element.nodeType === 'entity' && element.entity) {
      element.iconPath = new vscode.ThemeIcon('symbol-class');
      element.description = element.entity.table;
      element.tooltip = `${element.entity.package}\nTable: ${element.entity.table}`;
      element.command = {
        command: 'entityViewer.open',
        title: 'Open Domain Model',
        arguments: [element.entity.name],
      };
      element.contextValue = 'entity';
      return element;
    }

    element.iconPath = new vscode.ThemeIcon('info');
    return element;
  }

  getChildren(element?: PackageTreeItem): PackageTreeItem[] {
    if (!element) {
      return this.getRootChildren();
    }

    if (element.nodeType === 'package' && element.packageKey) {
      return this.getEntitiesForPackage(element.packageKey);
    }

    return [];
  }

  private getRootChildren(): PackageTreeItem[] {
    const openGraph = new PackageTreeItem(
      'open-graph',
      'Open Graph',
      vscode.TreeItemCollapsibleState.None
    );

    if (!vscode.workspace.workspaceFolders?.length) {
      const hint = new PackageTreeItem(
        'message',
        'Open a workspace folder',
        vscode.TreeItemCollapsibleState.None
      );
      return [openGraph, hint];
    }

    if (!this.model) {
      const loading = new PackageTreeItem(
        'message',
        'Loading entities…',
        vscode.TreeItemCollapsibleState.None
      );
      void this.loadModel();
      return [openGraph, loading];
    }

    if (this.model.entities.length === 0) {
      const empty = new PackageTreeItem(
        'message',
        'No entities found',
        vscode.TreeItemCollapsibleState.None
      );
      return [openGraph, empty];
    }

    const packages = new Map<string, EntityModel[]>();
    for (const entity of this.model.entities) {
      const key = getTopLevelPackage(entity.packageName);
      if (!packages.has(key)) {
        packages.set(key, []);
      }
      packages.get(key)!.push(entity);
    }

    const packageItems = [...packages.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([pkg, entities]) => {
        const item = new PackageTreeItem(
          'package',
          pkg,
          vscode.TreeItemCollapsibleState.Collapsed
        );
        item.packageKey = pkg;
        item.description = `${entities.length}`;
        return item;
      });

    return [openGraph, ...packageItems];
  }

  private getEntitiesForPackage(packageKey: string): PackageTreeItem[] {
    if (!this.model) {
      return [];
    }

    return this.model.entities
      .filter((e) => getTopLevelPackage(e.packageName) === packageKey)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entity) => {
        const item = new PackageTreeItem(
          'entity',
          entity.name,
          vscode.TreeItemCollapsibleState.None
        );
        item.entity = entity;
        return item;
      });
  }
}

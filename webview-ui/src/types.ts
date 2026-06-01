export type AppTheme = 'graphite-dark' | 'cursor-dark' | 'cursor-light';

export type RelationType =
  | 'ONE_TO_ONE'
  | 'ONE_TO_MANY'
  | 'MANY_TO_ONE'
  | 'MANY_TO_MANY';

export interface PropertyModel {
  name: string;
  type: string;
  nullable: boolean;
  isId?: boolean;
}

export interface RelationMetadata {
  mappedBy?: string;
  fetch?: string;
  cascade?: string;
  orphanRemoval?: boolean;
}

export interface EntityRelation {
  target: string;
  type: RelationType;
  fieldName: string;
  metadata?: RelationMetadata;
}

export interface EntityJson {
  name: string;
  package: string;
  table: string;
  filePath: string;
  properties: PropertyModel[];
  relations: EntityRelation[];
}

export interface RelationJson {
  source: string;
  target: string;
  type: RelationType;
  fieldName: string;
  metadata?: RelationMetadata;
}

export interface DomainModelJson {
  entities: EntityJson[];
  relations: RelationJson[];
}

export type VsCodeMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'openEntity'; entityName: string }
  | { type: 'openFile'; filePath: string };

export type ExtensionMessage =
  | { type: 'model'; data: DomainModelJson }
  | { type: 'selectEntity'; entityName: string }
  | { type: 'theme'; theme: AppTheme }
  | { type: 'error'; message: string };

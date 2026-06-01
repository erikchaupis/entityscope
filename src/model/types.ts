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

export interface RelationModel {
  source: string;
  target: string;
  type: RelationType;
  fieldName: string;
  metadata?: RelationMetadata;
}

export interface EntityModel {
  name: string;
  packageName: string;
  tableName: string;
  filePath: string;
  properties: PropertyModel[];
  relations: RelationModel[];
}

export interface DomainModel {
  entities: EntityModel[];
  relations: RelationModel[];
}

/** JSON contract sent to the webview */
export interface DomainModelJson {
  entities: Array<{
    name: string;
    package: string;
    table: string;
    filePath: string;
    properties: PropertyModel[];
    relations: Array<{
      target: string;
      type: RelationType;
      fieldName: string;
      metadata?: RelationMetadata;
    }>;
  }>;
  relations: Array<{
    source: string;
    target: string;
    type: RelationType;
    fieldName: string;
    metadata?: RelationMetadata;
  }>;
}

export function toJson(model: DomainModel): DomainModelJson {
  return {
    entities: model.entities.map((e) => ({
      name: e.name,
      package: e.packageName,
      table: e.tableName,
      filePath: e.filePath,
      properties: e.properties,
      relations: e.relations.map((r) => ({
        target: r.target,
        type: r.type,
        fieldName: r.fieldName,
        metadata: r.metadata,
      })),
    })),
    relations: model.relations.map((r) => ({
      source: r.source,
      target: r.target,
      type: r.type,
      fieldName: r.fieldName,
      metadata: r.metadata,
    })),
  };
}

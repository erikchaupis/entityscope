import * as fs from 'fs';
import * as path from 'path';
import {
  EntityModel,
  PropertyModel,
  RelationModel,
  RelationType,
} from '../model/types';
import { deduplicateRelations } from './relationDedup';

const CLASS_PATTERN = /<class\s+([^>]+)>([\s\S]*?)<\/class>/gi;

export function findHbmFiles(root: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'target' ||
          entry.name === 'build' ||
          entry.name === 'dist'
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.name.endsWith('.hbm.xml') || entry.name.endsWith('.hbm')) {
        results.push(fullPath);
      }
    }
  }

  walk(root);
  return results;
}

function stripXmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([\w:-]+)\s*=\s*["']([^"']*)["']/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/** Split `com.entityviewer.customer.User` → package + simple name */
export function splitClassName(className: string): { packageName: string; entityName: string } {
  const trimmed = className.trim();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot === -1) {
    return { packageName: '', entityName: trimmed };
  }
  return {
    packageName: trimmed.slice(0, lastDot),
    entityName: trimmed.slice(lastDot + 1),
  };
}

function simpleTypeName(hibernateType?: string): string {
  if (!hibernateType) {
    return 'Object';
  }
  const t = hibernateType.toLowerCase();
  if (t.includes('string')) return 'String';
  if (t.includes('int') || t === 'integer') return 'Integer';
  if (t.includes('long')) return 'Long';
  if (t.includes('boolean')) return 'Boolean';
  if (t.includes('double')) return 'Double';
  if (t.includes('big_decimal') || t.includes('bigdecimal')) return 'BigDecimal';
  if (t.includes('date') || t.includes('timestamp')) return 'Date';
  return hibernateType.split('.').pop() || hibernateType;
}

function collectionWrapperType(tag: string): string {
  switch (tag.toLowerCase()) {
    case 'list':
      return 'List';
    case 'bag':
      return 'List';
    case 'set':
    default:
      return 'Set';
  }
}

function resolveTargetClass(
  classAttr: string | undefined,
  entityNameAttr: string | undefined,
  entitiesByName: Map<string, EntityModel>
): string | null {
  const raw = classAttr || entityNameAttr;
  if (!raw) {
    return null;
  }
  const { entityName } = splitClassName(raw);
  if (entitiesByName.has(entityName)) {
    return entityName;
  }
  const match = [...entitiesByName.values()].find(
    (e) => e.name === entityName || raw.endsWith('.' + e.name)
  );
  return match?.name ?? entityName;
}

function parseClassBody(
  body: string,
  sourceEntity: string
): { properties: PropertyModel[]; relations: Omit<RelationModel, 'source'>[] } {
  const properties: PropertyModel[] = [];
  const relations: Omit<RelationModel, 'source'>[] = [];

  const idPattern = /<id\s+([^>]*?)\/?>/gi;
  let idMatch: RegExpExecArray | null;
  while ((idMatch = idPattern.exec(body)) !== null) {
    const attrs = parseAttributes(idMatch[1]);
    properties.push({
      name: attrs.name || 'id',
      type: simpleTypeName(attrs.type),
      nullable: false,
      isId: true,
    });
  }

  const propertyPattern = /<property\s+([^>]*?)\/?>/gi;
  let propMatch: RegExpExecArray | null;
  while ((propMatch = propertyPattern.exec(body)) !== null) {
    const attrs = parseAttributes(propMatch[1]);
    if (!attrs.name) {
      continue;
    }
    properties.push({
      name: attrs.name,
      type: simpleTypeName(attrs.type),
      nullable: attrs['not-null'] !== 'true',
    });
  }

  const manyToOnePattern = /<many-to-one\s+([^>]*?)\/?>/gi;
  let mtoMatch: RegExpExecArray | null;
  while ((mtoMatch = manyToOnePattern.exec(body)) !== null) {
    const attrs = parseAttributes(mtoMatch[1]);
    if (!attrs.name) {
      continue;
    }
    const target = splitClassName(attrs.class || attrs.entity || '').entityName;
    relations.push({
      target,
      type: 'MANY_TO_ONE',
      fieldName: attrs.name,
      metadata: attrs['not-null'] === 'true' ? {} : undefined,
    });
  }

  const oneToOnePattern = /<one-to-one\s+([^>]*?)\/?>/gi;
  let otoMatch: RegExpExecArray | null;
  while ((otoMatch = oneToOnePattern.exec(body)) !== null) {
    const attrs = parseAttributes(otoMatch[1]);
    if (!attrs.name) {
      continue;
    }
    const target = splitClassName(attrs.class || attrs.entity || '').entityName;
    const metadata =
      attrs['mapped-by'] || attrs.mappedBy
        ? { mappedBy: attrs['mapped-by'] || attrs.mappedBy }
        : undefined;
    relations.push({
      target,
      type: 'ONE_TO_ONE',
      fieldName: attrs.name,
      metadata,
    });
  }

  const oneToManyPattern = /<one-to-many\s+([^>]*?)\/?>/gi;
  let otmMatch: RegExpExecArray | null;
  while ((otmMatch = oneToManyPattern.exec(body)) !== null) {
    const attrs = parseAttributes(otmMatch[1]);
    if (!attrs.name) {
      continue;
    }
    const target = splitClassName(attrs.class || attrs.entity || '').entityName;
    const isInverse = attrs.inverse === 'true';
    relations.push({
      target,
      type: 'ONE_TO_MANY',
      fieldName: attrs.name,
      metadata: isInverse ? { mappedBy: 'inverse' } : undefined,
    });
  }

  const collectionPattern = /<(set|list|bag)\s+([^>]*)>([\s\S]*?)<\/\1>/gi;
  let collMatch: RegExpExecArray | null;
  while ((collMatch = collectionPattern.exec(body)) !== null) {
    const tag = collMatch[1];
    const attrs = parseAttributes(collMatch[2]);
    const inner = collMatch[3];
    const fieldName = attrs.name;
    if (!fieldName) {
      continue;
    }

    if (/<element\b/i.test(inner)) {
      const elementMatch = inner.match(/<element\s+([^>]*?)\/?>/i);
      const elementAttrs = elementMatch ? parseAttributes(elementMatch[1]) : {};
      const elementType = simpleTypeName(elementAttrs.type || attrs.type);
      properties.push({
        name: fieldName,
        type: `${collectionWrapperType(tag)}<${elementType}>`,
        nullable: true,
      });
      continue;
    }

    const oneToManyInner = inner.match(/<one-to-many\s+([^>]*?)\/?>/i);
    if (oneToManyInner) {
      const innerAttrs = parseAttributes(oneToManyInner[1]);
      const target = splitClassName(innerAttrs.class || innerAttrs.entity || '').entityName;
      const isInverse = attrs.inverse === 'true';
      relations.push({
        target,
        type: 'ONE_TO_MANY',
        fieldName,
        metadata: isInverse ? { mappedBy: 'inverse' } : undefined,
      });
      continue;
    }

    const manyToManyInner = inner.match(/<many-to-many\s+([^>]*?)\/?>/i);
    if (manyToManyInner) {
      const innerAttrs = parseAttributes(manyToManyInner[1]);
      const target = splitClassName(innerAttrs.class || innerAttrs.entity || '').entityName;
      const isInverse = attrs.inverse === 'true';
      const metadata =
        isInverse || innerAttrs['mapped-by'] || innerAttrs.mappedBy
          ? { mappedBy: innerAttrs['mapped-by'] || innerAttrs.mappedBy || 'inverse' }
          : undefined;
      relations.push({
        target,
        type: 'MANY_TO_MANY',
        fieldName,
        metadata,
      });
    }
  }

  return { properties, relations };
}

export function parseHbmFile(filePath: string): EntityModel[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const clean = stripXmlComments(content);
  const entities: EntityModel[] = [];

  let classMatch: RegExpExecArray | null;
  const classRegex = new RegExp(CLASS_PATTERN.source, CLASS_PATTERN.flags);
  while ((classMatch = classRegex.exec(clean)) !== null) {
    const classAttrs = parseAttributes(classMatch[1]);
    const className = classAttrs.name;
    if (!className) {
      continue;
    }

    const { packageName, entityName } = splitClassName(className);
    const tableName = classAttrs.table || entityName.toLowerCase();
    const body = classMatch[2];
    const { properties, relations } = parseClassBody(body, entityName);

    entities.push({
      name: entityName,
      packageName,
      tableName,
      filePath,
      properties,
      relations: relations.map((r) => ({ ...r, source: entityName })),
    });
  }

  return entities;
}

function mergeEntities(entities: EntityModel[]): EntityModel[] {
  const byKey = new Map<string, EntityModel>();

  for (const entity of entities) {
    const key = `${entity.packageName}|${entity.name}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...entity, properties: [...entity.properties], relations: [...entity.relations] });
      continue;
    }

    const propNames = new Set(existing.properties.map((p) => p.name));
    for (const prop of entity.properties) {
      if (!propNames.has(prop.name)) {
        existing.properties.push(prop);
        propNames.add(prop.name);
      }
    }

    const relKeys = new Set(existing.relations.map((r) => `${r.fieldName}|${r.target}|${r.type}`));
    for (const rel of entity.relations) {
      const rk = `${rel.fieldName}|${rel.target}|${rel.type}`;
      if (!relKeys.has(rk)) {
        existing.relations.push(rel);
        relKeys.add(rk);
      }
    }
  }

  return [...byKey.values()];
}

export function resolveHbmRelationTargets(entities: EntityModel[]): RelationModel[] {
  const entityByName = new Map<string, EntityModel>();
  for (const e of entities) {
    entityByName.set(e.name, e);
  }

  const allRelations: RelationModel[] = [];

  for (const entity of entities) {
    for (const rel of entity.relations) {
      const resolved = resolveTargetClass(
        rel.target,
        undefined,
        entityByName
      );
      const target = resolved || rel.target;

      allRelations.push({
        source: entity.name,
        target,
        type: rel.type,
        fieldName: rel.fieldName,
        metadata: rel.metadata,
      });
    }
  }

  return deduplicateRelations(allRelations);
}

export function scanHibernateXmlMappings(workspaceRoot: string, sourcePaths?: string[]): {
  entities: EntityModel[];
  relations: RelationModel[];
} {
  const roots = sourcePaths?.length ? sourcePaths : [workspaceRoot];
  const hbmFiles: string[] = [];
  for (const root of roots) {
    hbmFiles.push(...findHbmFiles(root));
  }

  const parsed = hbmFiles.flatMap((file) => parseHbmFile(file));
  const entities = mergeEntities(parsed);
  const relations = resolveHbmRelationTargets(entities);

  return { entities, relations };
}

import * as fs from 'fs';
import * as path from 'path';
import {
  EntityModel,
  PropertyModel,
  RelationMetadata,
  RelationModel,
  RelationType,
} from '../model/types';
import { deduplicateRelations } from './relationDedup';

const ENTITY_ANNOTATION = /@Entity\b/;
const TABLE_ANNOTATION = /@Table\s*(?:\(\s*(?:name\s*=\s*)?["']([^"']+)["']|\(\s*\))?/;
const PACKAGE_PATTERN = /^package\s+([\w.]+)\s*;/m;
const CLASS_PATTERN = /(?:@\w+(?:\([^)]*\))?\s*)*(?:public\s+)?(?:abstract\s+)?class\s+(\w+)/g;

const RELATION_ANNOTATIONS: Record<string, RelationType> = {
  OneToOne: 'ONE_TO_ONE',
  OneToMany: 'ONE_TO_MANY',
  ManyToOne: 'MANY_TO_ONE',
  ManyToMany: 'MANY_TO_MANY',
};

export function findJavaFiles(root: string): string[] {
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
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'target' || entry.name === 'build') {
          continue;
        }
        walk(fullPath);
      } else if (entry.name.endsWith('.java')) {
        results.push(fullPath);
      }
    }
  }

  walk(root);
  return results;
}

function extractPackage(content: string): string {
  const match = content.match(PACKAGE_PATTERN);
  return match ? match[1] : '';
}

function extractTableName(content: string, className: string): string {
  const tableMatch = content.match(/@Table\s*\(\s*name\s*=\s*["']([^"']+)["']/);
  if (tableMatch) {
    return tableMatch[1];
  }
  return camelToSnake(className);
}

function camelToSnake(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '') + 's';
}

function stripComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function extractAnnotationValue(annotation: string, key: string): string | undefined {
  const keyPattern = new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`);
  const match = annotation.match(keyPattern);
  if (match) {
    return match[1];
  }
  const enumPattern = new RegExp(`${key}\\s*=\\s*(\\w+)`);
  const enumMatch = annotation.match(enumPattern);
  return enumMatch ? enumMatch[1] : undefined;
}

function extractAnnotationBool(annotation: string, key: string): boolean | undefined {
  const pattern = new RegExp(`${key}\\s*=\\s*(true|false)`);
  const match = annotation.match(pattern);
  return match ? match[1] === 'true' : undefined;
}

function parseRelationMetadata(annotation: string): RelationMetadata {
  const metadata: RelationMetadata = {};
  const mappedBy = extractAnnotationValue(annotation, 'mappedBy');
  if (mappedBy) {
    metadata.mappedBy = mappedBy;
  }
  const fetch = extractAnnotationValue(annotation, 'fetch');
  if (fetch) {
    metadata.fetch = fetch;
  }
  const cascade = extractAnnotationValue(annotation, 'cascade');
  if (cascade) {
    metadata.cascade = cascade;
  }
  const orphanRemoval = extractAnnotationBool(annotation, 'orphanRemoval');
  if (orphanRemoval !== undefined) {
    metadata.orphanRemoval = orphanRemoval;
  }
  return metadata;
}

function extractClassBody(content: string, className: string): string | null {
  const classStart = content.search(
    new RegExp(`(?:public\\s+)?(?:abstract\\s+)?class\\s+${className}\\b`)
  );
  if (classStart === -1) {
    return null;
  }

  let braceCount = 0;
  let bodyStart = -1;
  for (let i = classStart; i < content.length; i++) {
    if (content[i] === '{') {
      if (bodyStart === -1) {
        bodyStart = i + 1;
      }
      braceCount++;
    } else if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0 && bodyStart !== -1) {
        return content.slice(bodyStart, i);
      }
    }
  }
  return null;
}

function extractBalancedParen(content: string, openIndex: number): string {
  let depth = 0;
  for (let i = openIndex; i < content.length; i++) {
    if (content[i] === '(') {
      depth++;
    } else if (content[i] === ')') {
      depth--;
      if (depth === 0) {
        return content.slice(openIndex, i + 1);
      }
    }
  }
  return content.slice(openIndex);
}

function extractAnnotationsBefore(text: string, fieldStart: number): string {
  const before = text.slice(0, fieldStart);
  const blockStart = Math.max(before.lastIndexOf(';'), before.lastIndexOf('{')) + 1;
  const block = before.slice(blockStart);
  const annotations: string[] = [];
  const annPattern = /@([\w.]+)/g;
  let match: RegExpExecArray | null;

  while ((match = annPattern.exec(block)) !== null) {
    const afterAt = block.slice(match.index);
    const nameMatch = afterAt.match(/^@([\w.]+)/);
    if (!nameMatch) {
      continue;
    }
    let ann = `@${nameMatch[1]}`;
    const parenIdx = nameMatch[0].length;
    if (afterAt[parenIdx] === '(') {
      ann += extractBalancedParen(afterAt, parenIdx);
    }
    annotations.push(ann);
  }

  return annotations.join(' ');
}

function getRelationAnnotation(annotations: string, annName: string): string {
  const idx = annotations.indexOf(`@${annName}`);
  if (idx === -1) {
    return `@${annName}`;
  }
  const slice = annotations.slice(idx);
  const nameMatch = slice.match(/^@([\w.]+)/);
  if (!nameMatch) {
    return `@${annName}`;
  }
  let ann = `@${nameMatch[1]}`;
  const parenIdx = nameMatch[0].length;
  if (slice[parenIdx] === '(') {
    ann += extractBalancedParen(slice, parenIdx);
  }
  return ann;
}

function parseFields(classBody: string): { properties: PropertyModel[]; relations: Omit<RelationModel, 'source'>[] } {
  const properties: PropertyModel[] = [];
  const relations: Omit<RelationModel, 'source'>[] = [];

  const fieldPattern =
    /(?:private|protected|public)\s+(?:static\s+)?(?:final\s+)?([\w.<>,\[\]? ]+?)\s+(\w+)\s*[;=]/g;

  let match: RegExpExecArray | null;
  while ((match = fieldPattern.exec(classBody)) !== null) {
    const fieldStart = match.index;
    const fieldType = match[1].trim().replace(/\s+/g, ' ');
    const fieldName = match[2];
    const annotations = extractAnnotationsBefore(classBody, fieldStart);

    if (annotations.includes('@Transient')) {
      continue;
    }

    let relationType: RelationType | null = null;
    let relationAnnotation = '';
    for (const [annName, type] of Object.entries(RELATION_ANNOTATIONS)) {
      if (annotations.includes(`@${annName}`)) {
        relationType = type;
        relationAnnotation = getRelationAnnotation(annotations, annName);
        break;
      }
    }

    if (relationType) {
      const targetType = fieldType
        .replace(/List<(\w+)>/, '$1')
        .replace(/Set<(\w+)>/, '$1')
        .replace(/Collection<(\w+)>/, '$1')
        .trim();
      relations.push({
        target: targetType.split('.').pop() || targetType,
        type: relationType,
        fieldName,
        metadata: parseRelationMetadata(relationAnnotation),
      });
      continue;
    }

    const isId =
      annotations.includes('@Id') ||
      annotations.includes('@EmbeddedId') ||
      annotations.includes('@MapsId');

    const nullable = !annotations.includes('@NotNull') && !isId;

    properties.push({
      name: fieldName,
      type: fieldType.split('.').pop() || fieldType,
      nullable,
      isId,
    });
  }

  return { properties, relations };
}

export function parseJavaFile(filePath: string): EntityModel | null {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  const clean = stripComments(content);

  if (!ENTITY_ANNOTATION.test(clean)) {
    return null;
  }

  const packageName = extractPackage(clean);

  let className: string | null = null;
  const classMatches = [...clean.matchAll(CLASS_PATTERN)];
  for (const m of classMatches) {
    const idx = m.index ?? 0;
    const preceding = clean.slice(Math.max(0, idx - 500), idx);
    if (preceding.includes('@Entity') || preceding.includes('@MappedSuperclass')) {
      className = m[1];
      break;
    }
  }

  if (!className) {
    const entityIdx = clean.search(/@Entity/);
    if (entityIdx !== -1) {
      const afterEntity = clean.slice(entityIdx, entityIdx + 500);
      const nameMatch = afterEntity.match(/class\s+(\w+)/);
      className = nameMatch ? nameMatch[1] : null;
    }
  }

  if (!className) {
    return null;
  }

  const tableName = extractTableName(clean, className);
  const classBody = extractClassBody(clean, className);

  if (!classBody) {
    return {
      name: className,
      packageName,
      tableName,
      filePath,
      properties: [],
      relations: [],
    };
  }

  const { properties, relations } = parseFields(classBody);

  return {
    name: className,
    packageName,
    tableName,
    filePath,
    properties,
    relations: relations.map((r) => ({ ...r, source: className! })),
  };
}

export function resolveRelationTargets(entities: EntityModel[]): RelationModel[] {
  const entityByName = new Map<string, EntityModel>();
  for (const e of entities) {
    entityByName.set(e.name, e);
  }

  const allRelations: RelationModel[] = [];

  for (const entity of entities) {
    for (const rel of entity.relations) {
      let target = rel.target;

      if (!entityByName.has(target)) {
        const match = entities.find(
          (e) => e.name === target || e.name.endsWith('.' + target)
        );
        if (match) {
          target = match.name;
        }
      }

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

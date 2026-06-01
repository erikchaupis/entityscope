import { DomainModel, EntityModel, RelationModel } from '../model/types';
import { HibernateXmlScanner } from './HibernateXmlScanner';
import { ModelScanner, ScanContext } from './ModelScanner';
import { deduplicateRelations } from './relationDedup';
import { findHbmFiles } from './hibernateXmlParser';
import { findJavaFiles, parseJavaFile, resolveRelationTargets } from './javaParser';

export class JpaScanner implements ModelScanner {
  async scan(context: ScanContext): Promise<DomainModel> {
    const roots = context.sourcePaths?.length
      ? context.sourcePaths
      : [context.workspaceRoot];

    const javaFiles: string[] = [];
    for (const root of roots) {
      javaFiles.push(...findJavaFiles(root));
    }

    const entities = javaFiles
      .map((file) => parseJavaFile(file))
      .filter((e): e is NonNullable<typeof e> => e !== null);

    const relations = resolveRelationTargets(entities);

    return { entities, relations };
  }
}

function projectHasJpaEntities(workspaceRoot: string, sourcePaths?: string[]): boolean {
  const roots = sourcePaths?.length ? sourcePaths : [workspaceRoot];
  for (const root of roots) {
    for (const file of findJavaFiles(root)) {
      if (parseJavaFile(file) !== null) {
        return true;
      }
    }
  }
  return false;
}

function projectHasHbmMappings(workspaceRoot: string, sourcePaths?: string[]): boolean {
  const roots = sourcePaths?.length ? sourcePaths : [workspaceRoot];
  for (const root of roots) {
    if (findHbmFiles(root).length > 0) {
      return true;
    }
  }
  return false;
}

function mergeDomainModels(...models: DomainModel[]): DomainModel {
  const entityByKey = new Map<string, EntityModel>();
  const allRelations: RelationModel[] = [];

  for (const model of models) {
    for (const entity of model.entities) {
      const key = `${entity.packageName}|${entity.name}`;
      const existing = entityByKey.get(key);
      if (!existing) {
        entityByKey.set(key, {
          ...entity,
          properties: [...entity.properties],
          relations: [...entity.relations],
        });
        continue;
      }

      const propNames = new Set(existing.properties.map((p) => p.name));
      for (const prop of entity.properties) {
        if (!propNames.has(prop.name)) {
          existing.properties.push(prop);
          propNames.add(prop.name);
        }
      }

      const relKeys = new Set(
        existing.relations.map((r) => `${r.fieldName}|${r.target}|${r.type}`)
      );
      for (const rel of entity.relations) {
        const rk = `${rel.fieldName}|${rel.target}|${rel.type}`;
        if (!relKeys.has(rk)) {
          existing.relations.push(rel);
          relKeys.add(rk);
        }
      }
    }

    allRelations.push(...model.relations);
  }

  return {
    entities: [...entityByKey.values()],
    relations: deduplicateRelations(allRelations),
  };
}

class CompositeScanner implements ModelScanner {
  constructor(private readonly scanners: ModelScanner[]) {}

  async scan(context: ScanContext): Promise<DomainModel> {
    const models = await Promise.all(this.scanners.map((s) => s.scan(context)));
    return mergeDomainModels(...models);
  }
}

export function getScannerForProject(
  workspaceRoot: string,
  sourcePaths?: string[]
): ModelScanner {
  const hasHbm = projectHasHbmMappings(workspaceRoot, sourcePaths);
  const hasJpa = projectHasJpaEntities(workspaceRoot, sourcePaths);

  if (hasHbm && hasJpa) {
    return new CompositeScanner([new JpaScanner(), new HibernateXmlScanner()]);
  }
  if (hasHbm) {
    return new HibernateXmlScanner();
  }
  return new JpaScanner();
}

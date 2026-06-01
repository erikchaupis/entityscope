import { DomainModel } from '../model/types';
import { ModelScanner, ScanContext } from './ModelScanner';
import { scanHibernateXmlMappings } from './hibernateXmlParser';

export class HibernateXmlScanner implements ModelScanner {
  async scan(context: ScanContext): Promise<DomainModel> {
    const { entities, relations } = scanHibernateXmlMappings(
      context.workspaceRoot,
      context.sourcePaths
    );
    return { entities, relations };
  }
}

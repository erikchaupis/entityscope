import * as path from 'path';
import { scanHibernateXmlMappings } from '../src/scanner/hibernateXmlParser';

const sampleRoot = path.join(__dirname, '../sample-projects/hibernate-xml-sample');
const model = scanHibernateXmlMappings(sampleRoot);

const entityNames = model.entities.map((e) => e.name).sort();
const relationKeys = model.relations.map(
  (r) => `${r.source}->${r.target} (${r.type})`
);

console.log('Entities:', entityNames.length, entityNames.join(', '));
console.log('Relations:', model.relations.length);
for (const key of relationKeys) {
  console.log(' ', key);
}

const user = model.entities.find((e) => e.name === 'User');
const tags = user?.properties.find((p) => p.name === 'tags');
console.log('User.tags:', tags?.type);

const tagEdges = model.relations.filter(
  (r) => r.fieldName === 'tags' || r.target === 'tags' || r.source === 'tags'
);
if (tagEdges.length > 0) {
  console.error('FAIL: tags should not create graph edges');
  process.exit(1);
}

if (entityNames.length !== 9) {
  console.error(`FAIL: expected 9 entities, got ${entityNames.length}`);
  process.exit(1);
}

if (!tags || tags.type !== 'Set<String>') {
  console.error(`FAIL: expected User.tags Set<String>, got ${tags?.type}`);
  process.exit(1);
}

if (user?.packageName !== 'com.entityviewer.customer') {
  console.error(`FAIL: expected FQCN package, got ${user?.packageName}`);
  process.exit(1);
}

console.log('OK');

# Changelog

All notable changes to **EntityScope** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-01

Initial public release.

### Domain model scanning

- **JPA entity discovery** — scans `@Entity` classes and relationship annotations (`@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`)
- **Entity metadata** — `@Table`, `@Id`, `@EmbeddedId`, `@Embeddable`, `@MappedSuperclass`; `cascade`, `fetch`, `orphanRemoval`, `mappedBy`
- **Hibernate XML mapping** — scans `*.hbm.xml` (Hibernate 3.x style): `class`, `id`, `property`, associations, `set` / `list` / `bag`
- **Primitive collections** — `element` mappings without graph edges
- **Composite workspaces** — JPA and Hibernate XML sources merged when both are present
- **Auto scanner selection** — picks JPA, Hibernate XML, or composite scanner per project

### Interactive graph

- **React Flow diagram** with **ELK** automatic layout
- **Entity nodes** — package-colored headers, optional property fields, ID highlighting
- **Relationship edges** — type and cardinality labels
- **Relationship legend** — color-coded types; expand on hover
- **Minimap** — semi-transparent overview, stronger on hover
- **Zoom controls** — zoom in, zoom out, fit view (tuned initial framing)
- **Pan and select** — click to select; keyboard shortcuts for details and open source

### Navigation and search

- **Activity Bar** — EntityScope view with **Packages** tree
- **Open Graph** from sidebar; open or focus entities from the tree
- **In-graph package sidebar** — collapsible panel, per-package expand/collapse, **expand all** / **collapse all**
- **Package filter** — focus the graph on one package; clear filter
- **Search** — filter entities by name or table name
- **Entity count** in toolbar

### Entity actions

- **Details panel** — properties, relations, and metadata (hidden by default; toggle from toolbar, node actions, or Enter)
- **Open source** — jump to `.java` or mapping file (context menu, double-click, ⌘/Ctrl+Enter)
- **Center view** on selected entity
- **Copy** entity name or fully qualified name
- **Context menu** on graph nodes

### Theming

- **Light**, **Dark**, and **Graphite** themes (cycle from toolbar)
- **Editor-aware default** — matches VS Code / compatible editor light vs dark; Graphite when the workbench theme name includes “graphite”
- **Manual theme override** — persisted for the session until changed again

### Commands

| Command | Description |
|---------|-------------|
| `EntityScope: Open Domain Model` | Scan workspace and open the graph |
| `EntityScope: Refresh Model` | Re-scan entities (sidebar + open graph) |
| `EntityScope: Select Current Entity` | Open graph and select the entity in the active editor |

> Internal command IDs remain `entityViewer.*` for compatibility.

### Editor integration

- **Explorer / editor context menu** — open graph from `.java` or `.hbm.xml`
- **Workspace refresh** on folder changes
- **Progress notification** while scanning

### Packaging and compatibility

- Single **`.vsix`** for **VS Code** and **Open VSX** editors (including Cursor)
- **VS Code engine** `^1.85.0`
- Sample projects: `sample-projects/jpa-sample/`, `sample-projects/hibernate-xml-sample/`
- Validation script: `npm run validate:hibernate-sample`

### License

- [Apache-2.0](LICENSE)

[0.1.0]: https://github.com/erikchaupis/entityscope/releases/tag/v0.1.0

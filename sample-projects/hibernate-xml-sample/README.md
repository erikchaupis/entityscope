# Hibernate XML Sample

Legacy Hibernate 3.x XML mapping sample for EntityScope development and regression testing.

## Packages

| Package | Entities |
|---------|----------|
| `com.entityviewer.customer` | User, Address |
| `com.entityviewer.order` | Order, OrderItem |
| `com.entityviewer.billing` | Payment, Invoice |
| `com.entityviewer.inventory` | Product, Category, Warehouse |

## Mapping features demonstrated

- `<class>` with fully qualified class names
- `<id>`, `<property>`
- `<many-to-one>`, `<one-to-many>`, `<many-to-many>`, `<one-to-one>`
- Primitive collection: `User.tags` as `<set>` + `<element type="string"/>`

## Usage

Open this folder as the VS Code workspace (or use the **Run Extension (Hibernate XML)** launch configuration) and run **EntityScope: Open Domain Model**.

Primitive collections such as `tags` appear in entity details only and do not create graph edges.

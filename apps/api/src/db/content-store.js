export const contentCollections = {
  pages: 'pages',
  events: 'events',
  programs: 'programs',
  plans: 'membership_plans',
  slots: 'coaching_slots',
  gallery: 'gallery',
  team: 'team_members',
};

export function contentDocument(row) {
  if (!contentCollections[row.kind]) throw new Error(`Unknown content kind: ${row.kind}`);
  const content = JSON.parse(row.data);
  if (!content || typeof content !== 'object' || Array.isArray(content))
    throw new Error('Invalid content object');
  return {
    _id: row.id,
    id: row.id,
    kind: row.kind,
    created_at: row.created_at,
    updated_at: row.created_at,
    content,
  };
}

export function contentRow(document) {
  return {
    id: document.id,
    kind: document.kind,
    created_at: document.created_at,
    data: JSON.stringify(document.content),
  };
}

// Compatibility for historic migrations that query serialized JSON with LIKE.
function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$and') return value.every((part) => matches(row, part));
    if (key === '$or') return value.some((part) => matches(row, part));
    if (value && typeof value === 'object')
      return Object.entries(value).every(([op, operand]) => {
        switch (op) {
          case '$regex':
            return new RegExp(operand).test(row[key]);
          case '$eq':
            return row[key] === operand;
          case '$ne':
            return row[key] !== operand;
          case '$in':
            return operand.includes(row[key]);
          case '$gt':
            return row[key] > operand;
          case '$gte':
            return row[key] >= operand;
          case '$lt':
            return row[key] < operand;
          case '$lte':
            return row[key] <= operand;
          default:
            throw new Error(`Unsupported content filter: ${op}`);
        }
      });
    return row[key] === value;
  });
}

export async function createContentIndexes(database) {
  for (const [kind, name] of Object.entries(contentCollections)) {
    await database.collection(name).createIndex({ id: 1 }, { unique: true });
    await database.collection(name).createIndex({ 'content.published': 1, id: 1 });
    if (kind === 'pages')
      await database.collection(name).createIndex({ 'content.slug': 1 }, { unique: true });
    if (kind === 'events' || kind === 'slots')
      await database.collection(name).createIndex({ 'content.start': 1 });
  }
}

export function categorizedContent(database, options) {
  const collection = (kind) => {
    if (!contentCollections[kind]) throw new Error('Unknown content kind');
    return database.collection(contentCollections[kind]);
  };
  return {
    async all(filter = {}, sort = {}, fields) {
      const kinds =
        typeof filter.kind === 'string' ? [filter.kind] : Object.keys(contentCollections);
      let rows = [];
      for (const kind of kinds) {
        const query = typeof filter.id === 'number' ? { id: filter.id } : {};
        const documents = await collection(kind).find(query, options()).toArray();
        rows.push(...documents.map(contentRow).filter((row) => matches(row, filter)));
      }
      rows.sort((a, b) => {
        for (const [key, direction] of Object.entries(sort)) {
          if (a[key] < b[key]) return -direction;
          if (a[key] > b[key]) return direction;
        }
        return 0;
      });
      return fields
        ? rows.map((row) => Object.fromEntries(fields.map((key) => [key, row[key]])))
        : rows;
    },
    async insert(row) {
      await collection(row.kind).insertOne(contentDocument(row), options());
    },
    async update(filter, values) {
      const rows = await this.all(filter);
      for (const row of rows) {
        if (values.kind && values.kind !== row.kind) throw new Error('Content kind cannot change');
        const document = contentDocument({ ...row, ...values });
        document.updated_at = new Date().toISOString();
        await collection(row.kind).replaceOne({ id: row.id }, document, options());
      }
      return { changes: rows.length };
    },
    async remove(filter) {
      const rows = await this.all(filter);
      for (const row of rows) await collection(row.kind).deleteOne({ id: row.id }, options());
      return { changes: rows.length };
    },
  };
}

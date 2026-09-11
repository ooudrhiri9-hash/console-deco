/**
 * MongoDB store. Same interface as the JSON store, so nothing above this file
 * knows which one is running.
 *
 * The schemas are deliberately loose (`strict: false`): a product carries
 * bilingual sub-documents like `name: { fr, en }` and a size-free `dimensions`
 * object. Declaring each field would mean editing this file every time the
 * catalogue gains an attribute, and silently dropping anything not declared.
 * Validation lives in src/lib/product.js instead, where it can return a usable
 * error message.
 */
import mongoose from 'mongoose';

const loose = (extra = {}) => new mongoose.Schema(
  extra,
  // `id: false` is essential, not cosmetic: Mongoose adds an `id` virtual (the
  // string form of _id) to every schema, and that virtual shadows the real
  // `id` field our categories and messages are keyed on — they would all be
  // stored as `id: null` and collide on the unique index at the second write.
  { strict: false, versionKey: false, minimize: false, id: false },
);

function models(connection) {
  const define = (name, collectionName, indexes = []) => {
    const schema = loose();
    for (const [fields, options] of indexes) schema.index(fields, options);
    return connection.model(name, schema, collectionName);
  };

  return {
    Product: define('Product', 'products', [
      [{ slug: 1 }, { unique: true }],
      [{ categoryId: 1 }, {}],
    ]),
    Category: define('Category', 'categories', [[{ id: 1 }, { unique: true }]]),
    Order: define('Order', 'orders', [
      [{ reference: 1 }, { unique: true }],
      [{ createdAt: -1 }, {}],
    ]),
    Message: define('Message', 'messages', [[{ id: 1 }, { unique: true }]]),
    Admin: define('Admin', 'admins', [[{ email: 1 }, { unique: true }]]),
    Settings: define('Settings', 'settings', []),
  };
}

export function createMongoStore(uri, dbName) {
  const connection = mongoose.createConnection(uri, {
    dbName: dbName || undefined,
    serverSelectionTimeoutMS: 10_000,
  });
  const M = models(connection);

  /** Strip Mongo's own keys so callers get the document they wrote. */
  const plain = (doc) => {
    if (!doc) return null;
    const { _id, __v, ...rest } = doc.toObject ? doc.toObject() : doc;
    return rest;
  };

  function collection(Model, key) {
    return {
      async all() {
        return (await Model.find({}).lean()).map(plain);
      },
      async find(predicate) {
        return (await Model.find({}).lean()).map(plain).find(predicate) ?? null;
      },
      async get(value) {
        return plain(await Model.findOne({ [key]: value }).lean());
      },
      async create(doc) {
        return plain(await Model.create(doc));
      },
      async update(value, patch) {
        return plain(
          await Model.findOneAndUpdate({ [key]: value }, { $set: patch }, { new: true }).lean(),
        );
      },
      async remove(value) {
        const { deletedCount } = await Model.deleteOne({ [key]: value });
        return deletedCount > 0;
      },
      async replaceAll(docs) {
        await Model.deleteMany({});
        if (docs.length) await Model.insertMany(docs);
      },
    };
  }

  return {
    kind: 'mongo',
    label: uri.replace(/\/\/[^@]*@/, '//***@'),
    async connect() {
      await connection.asPromise();
    },
    products: collection(M.Product, 'slug'),
    categories: collection(M.Category, 'id'),
    orders: collection(M.Order, 'reference'),
    messages: collection(M.Message, 'id'),
    admins: collection(M.Admin, 'email'),
    settings: {
      async read() {
        const doc = await M.Settings.findOne({ key: 'site' }).lean();
        if (!doc) return {};
        const { _id, __v, key, ...rest } = doc;
        return rest;
      },
      async write(patch) {
        const doc = await M.Settings.findOneAndUpdate(
          { key: 'site' },
          { $set: patch },
          { new: true, upsert: true },
        ).lean();
        const { _id, __v, key, ...rest } = doc;
        return rest;
      },
    },
  };
}

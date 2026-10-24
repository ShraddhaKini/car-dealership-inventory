const UPDATABLE_FIELDS = ['make', 'model', 'category', 'price', 'quantity'];

/** Escapes LIKE wildcards so user input is matched literally. */
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

/** Data access for the vehicles table. */
class VehicleRepository {
  constructor(db) {
    this.db = db;
    this.insertStatement = db.prepare(
      'INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)'
    );
    this.findAllStatement = db.prepare('SELECT * FROM vehicles ORDER BY id');
    this.findByIdStatement = db.prepare('SELECT * FROM vehicles WHERE id = ?');
    this.deleteStatement = db.prepare('DELETE FROM vehicles WHERE id = ?');
    this.decrementStatement = db.prepare(
      'UPDATE vehicles SET quantity = quantity - ? WHERE id = ? AND quantity >= ?'
    );
    this.incrementStatement = db.prepare(
      'UPDATE vehicles SET quantity = quantity + ? WHERE id = ?'
    );
  }

  create({ make, model, category, price, quantity }) {
    const result = this.insertStatement.run(make, model, category, price, quantity);
    return this.findById(result.lastInsertRowid);
  }

  findAll() {
    return this.findAllStatement.all();
  }

  findById(id) {
    return this.findByIdStatement.get(id) || null;
  }

  /**
   * Finds vehicles matching every provided filter.
   * make/model match partially, category matches exactly (all case-insensitive),
   * minPrice/maxPrice are inclusive bounds.
   */
  search({ make, model, category, minPrice, maxPrice } = {}) {
    const conditions = [];
    const params = [];

    if (make) {
      conditions.push("make LIKE ? ESCAPE '\\'");
      params.push(`%${escapeLike(make)}%`);
    }
    if (model) {
      conditions.push("model LIKE ? ESCAPE '\\'");
      params.push(`%${escapeLike(model)}%`);
    }
    if (category) {
      conditions.push('category = ? COLLATE NOCASE');
      params.push(category);
    }
    if (minPrice !== undefined) {
      conditions.push('price >= ?');
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      conditions.push('price <= ?');
      params.push(maxPrice);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return this.db.prepare(`SELECT * FROM vehicles ${where} ORDER BY id`).all(...params);
  }

  /** Updates only the supplied fields; returns the updated vehicle or null if missing. */
  update(id, fields) {
    const columns = UPDATABLE_FIELDS.filter((field) => fields[field] !== undefined);
    if (columns.length > 0) {
      const assignments = columns.map((column) => `${column} = ?`).join(', ');
      const values = columns.map((column) => fields[column]);
      this.db.prepare(`UPDATE vehicles SET ${assignments} WHERE id = ?`).run(...values, id);
    }
    return this.findById(id);
  }

  delete(id) {
    return this.deleteStatement.run(id).changes > 0;
  }

  /** Atomically removes stock; returns false when there is not enough quantity. */
  decrementStock(id, amount) {
    return this.decrementStatement.run(amount, id, amount).changes > 0;
  }

  incrementStock(id, amount) {
    return this.incrementStatement.run(amount, id).changes > 0;
  }
}

module.exports = VehicleRepository;

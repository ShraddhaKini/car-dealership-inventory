/** Data access for the users table. */
class UserRepository {
  constructor(db) {
    this.insertStatement = db.prepare(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)'
    );
    this.findByEmailStatement = db.prepare('SELECT * FROM users WHERE email = ?');
    this.findByIdStatement = db.prepare('SELECT * FROM users WHERE id = ?');
  }

  create({ email, passwordHash, role = 'user' }) {
    const result = this.insertStatement.run(email, passwordHash, role);
    return this.findById(result.lastInsertRowid);
  }

  findByEmail(email) {
    return this.toEntity(this.findByEmailStatement.get(email));
  }

  findById(id) {
    return this.toEntity(this.findByIdStatement.get(id));
  }

  toEntity(row) {
    if (!row) return null;
    return { id: row.id, email: row.email, passwordHash: row.password_hash, role: row.role };
  }
}

module.exports = UserRepository;

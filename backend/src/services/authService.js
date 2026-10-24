const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateCredentials } = require('../validators/authValidator');
const { AuthenticationError, ConflictError } = require('../errors');

/** Registration, login and JWT verification. */
class AuthService {
  /**
   * @param {UserRepository} userRepository
   * @param {{jwtSecret: string, jwtExpiresIn?: string, bcryptRounds?: number}} options
   */
  constructor(userRepository, { jwtSecret, jwtExpiresIn = '1h', bcryptRounds = 10 }) {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.bcryptRounds = bcryptRounds;
  }

  /** Creates an account. Public sign-ups are always 'user'; only trusted code may pass another role. */
  async register(payload, role = 'user') {
    const { email, password } = validateCredentials(payload, { enforcePasswordRules: true });

    if (this.userRepository.findByEmail(email)) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, this.bcryptRounds);
    return this.toPublicUser(this.userRepository.create({ email, passwordHash, role }));
  }

  /** Verifies credentials and returns a signed token together with the public user. */
  async login(payload) {
    const { email, password } = validateCredentials(payload);

    const user = this.userRepository.findByEmail(email);
    const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));
    if (!passwordMatches) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = jwt.sign({ role: user.role }, this.jwtSecret, {
      subject: String(user.id),
      expiresIn: this.jwtExpiresIn,
    });
    return { token, user: this.toPublicUser(user) };
  }

  /** Returns the {id, role} carried by a valid token or throws AuthenticationError. */
  verifyToken(token) {
    try {
      const payload = jwt.verify(token, this.jwtSecret);
      return { id: Number(payload.sub), role: payload.role };
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  toPublicUser(user) {
    return { id: user.id, email: user.email, role: user.role };
  }
}

module.exports = AuthService;

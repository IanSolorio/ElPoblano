import { AppError } from "../../../shared/errors/AppError.js";
import { createSessionToken, hashSessionToken } from "../../../shared/security/sessionToken.js";

const publicUser = ({ id, email, firstName, lastName, phone, role, addresses = [] }) => ({
  id, email, firstName, lastName, phone, role,
  addresses: addresses.map((address) => ({
    ...address,
    latitude: Number(address.latitude),
    longitude: Number(address.longitude),
  })),
});

export class AuthService {
  constructor(repository, passwordHasher, sessionDurationDays = 7) {
    this.repository = repository;
    this.passwordHasher = passwordHasher;
    this.sessionDurationDays = sessionDurationDays;
  }

  async register(data) {
    const email = data.email.trim().toLowerCase();
    if (await this.repository.findByEmail(email)) {
      throw new AppError("El correo ya está registrado.", 409, "EMAIL_ALREADY_EXISTS");
    }
    const user = await this.repository.createUser({
      email,
      passwordHash: await this.passwordHasher.hash(data.password),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || null,
      addresses: {
        create: {
          label: data.address.label,
          addressLine: data.address.addressLine,
          reference: data.address.reference || null,
          latitude: data.address.latitude,
          longitude: data.address.longitude,
          isDefault: true,
        },
      },
    });
    await this.repository.writeAudit({ userId: user.id, action: "USER_REGISTERED", entity: "User", entityId: user.id });
    return this.#createSession(user);
  }

  async login(emailInput, password) {
    const user = await this.repository.findByEmail(emailInput.trim().toLowerCase());
    if (!user || !user.active || !(await this.passwordHasher.verify(user.passwordHash, password))) {
      throw new AppError("Credenciales incorrectas.", 401, "INVALID_CREDENTIALS");
    }
    await this.repository.writeAudit({ userId: user.id, action: "USER_LOGGED_IN", entity: "Session" });
    return this.#createSession(user);
  }

  async logout(token) {
    if (token) await this.repository.revokeSession(hashSessionToken(token));
  }

  async authenticate(token) {
    if (!token) throw new AppError("Debes iniciar sesión.", 401, "AUTHENTICATION_REQUIRED");
    const session = await this.repository.findActiveSession(hashSessionToken(token));
    if (!session) throw new AppError("La sesión no es válida o ha expirado.", 401, "INVALID_SESSION");
    return publicUser(session.user);
  }

  async #createSession(user) {
    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + this.sessionDurationDays * 86400000);
    await this.repository.createSession({ userId: user.id, tokenHash: hashSessionToken(token), expiresAt });
    return { token, expiresAt, user: publicUser(user) };
  }
}

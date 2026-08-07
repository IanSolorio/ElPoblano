import { AppError } from "../../../shared/errors/AppError.js";

const cookieToken = (header = "") => header
  .split(";")
  .map((part) => part.trim().split("="))
  .find(([name]) => name === "elpoblano_session")?.[1];

export const extractSessionToken = (request) => {
  const bearer = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  return bearer || cookieToken(request.headers.cookie);
};

export const createAuthenticationMiddleware = (authService) => async (request, _response, next) => {
  try {
    request.user = await authService.authenticate(extractSessionToken(request));
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (request, _response, next) => {
  if (!["ADMIN", "SUPER_ADMIN"].includes(request.user?.role)) return next(new AppError("Acceso restringido a administradores.", 403, "FORBIDDEN"));
  next();
};

export const requireSuperAdmin = (request, _response, next) => {
  if (request.user?.role !== "SUPER_ADMIN") return next(new AppError("Acceso restringido al administrador principal.", 403, "SUPER_ADMIN_REQUIRED"));
  next();
};

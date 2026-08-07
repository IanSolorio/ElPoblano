export const errorHandler = (error, _request, response, _next) => {
  const prismaStatuses = { P2002: 409, P2003: 409, P2025: 404 };
  const prismaStatus = prismaStatuses[error.code];
  const uploadStatus = error.code === "LIMIT_FILE_SIZE" ? 413 : error.name === "MulterError" ? 400 : undefined;
  const status = error.status ?? prismaStatus ?? uploadStatus ?? (error.name === "SyntaxError" ? 400 : 500);
  const isProduction = process.env.NODE_ENV === "production";
  const isValidationError = error.name === "ZodError";
  const message = isValidationError
    ? "Los datos enviados no son válidos. Revisa los campos e inténtalo nuevamente."
    : status === 500 && isProduction ? "Error interno del servidor." : error.message;
  if (status >= 500) console.error(JSON.stringify({ level: "error", requestId: _request.id, message: error.message, stack: error.stack }));
  response.status(status).json({
    code: isValidationError ? "VALIDATION_ERROR" : error.code ?? "INTERNAL_ERROR",
    message: message ?? "Error interno del servidor.",
    requestId: _request.id,
    details: error.issues?.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
};

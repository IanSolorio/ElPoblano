export const errorHandler = (error, _request, response, _next) => {
  const prismaStatuses = { P2002: 409, P2003: 409, P2025: 404 };
  const prismaStatus = prismaStatuses[error.code];
  let uploadStatus;
  if (error.code === "LIMIT_FILE_SIZE") uploadStatus = 413;
  else if (error.name === "MulterError") uploadStatus = 400;
  const status = error.status ?? prismaStatus ?? uploadStatus ?? (error.name === "SyntaxError" ? 400 : 500);
  const isProduction = process.env.NODE_ENV === "production";
  const isValidationError = error.name === "ZodError";
  let message = error.message;
  if (isValidationError) message = "Los datos enviados no son válidos. Revisa los campos e inténtalo nuevamente.";
  else if (status === 500 && isProduction) message = "Error interno del servidor.";
  if (status >= 500) console.error(JSON.stringify({ level: "error", message: "Unhandled server error" }));
  response.status(status).json({
    code: isValidationError ? "VALIDATION_ERROR" : error.code ?? "INTERNAL_ERROR",
    message: message ?? "Error interno del servidor.",
    requestId: _request.id,
    details: error.issues?.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
};

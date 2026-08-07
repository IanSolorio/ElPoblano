import { randomUUID } from "node:crypto";

export const requestContext = (request, response, next) => {
  request.id = request.get("X-Request-Id") || randomUUID();
  response.set("X-Request-Id", request.id);
  next();
};

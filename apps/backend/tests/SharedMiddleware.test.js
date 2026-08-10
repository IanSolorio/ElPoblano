import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { validate } from "../src/shared/middleware/validate.js";
import { errorHandler } from "../src/shared/middleware/errorHandler.js";
import { requestContext } from "../src/shared/middleware/requestContext.js";

test("UT-SHR-01: validación correcta entrega datos transformados", () => {
  const request = { query: { page: "2" } }; let error; validate(z.object({ page: z.coerce.number().int() }), "query")(request, {}, (value) => { error = value; }); assert.equal(error, undefined); assert.deepEqual(request.validated.query, { page: 2 });
});

test("UT-SHR-02: validación inválida produce ZodError uniforme con 422", () => {
  const request = { body: { email: "incorrecto" } }; let error; validate(z.object({ email: z.email() }))(request, {}, (value) => { error = value; }); assert.equal(error.name, "ZodError"); assert.equal(error.status, 422); assert.ok(error.issues.length);
});

test("UT-SHR-03: error de producción incluye requestId y oculta stack", () => {
  const previous = process.env.NODE_ENV; process.env.NODE_ENV = "production"; const originalError = console.error; console.error = () => {};
  try {
    let status; let body; const response = { status(value) { status = value; return this; }, json(value) { body = value; return this; } }; const error = new Error("detalle secreto");
    errorHandler(error, { id: "request-1" }, response, () => {}); assert.equal(status, 500); assert.equal(body.message, "Error interno del servidor."); assert.equal(body.requestId, "request-1"); assert.equal(body.stack, undefined);
  } finally { console.error = originalError; process.env.NODE_ENV = previous; }
});

test("UT-SHR-04: contexto genera o propaga identificador de solicitud", () => {
  for (const supplied of ["external-id", undefined]) {
    const headers = {}; const request = { get: () => supplied }; const response = { set: (name, value) => { headers[name] = value; } }; let next = false; requestContext(request, response, () => { next = true; }); assert.equal(headers["X-Request-Id"], request.id); assert.equal(next, true); if (supplied) assert.equal(request.id, supplied); else assert.match(request.id, /^[0-9a-f-]{36}$/);
  }
});

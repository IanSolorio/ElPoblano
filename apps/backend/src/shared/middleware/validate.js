export const validate = (schema, source = "body") => (request, _response, next) => {
  const result = schema.safeParse(request[source]);
  if (!result.success) {
    result.error.status = 422;
    return next(result.error);
  }
  if (source === "body") request.body = result.data;
  else request.validated = { ...request.validated, [source]: result.data };
  next();
};

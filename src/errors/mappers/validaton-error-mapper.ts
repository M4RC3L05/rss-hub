import { HTTPException } from "hono/http-exception";
import RequestValidationError from "../request-validation-error.js";

const validationErrorMapper = (error: unknown) => {
  if (!(error instanceof RequestValidationError)) return;

  return Object.assign(new HTTPException(422, { message: error.message }), {
    validationErrors: error.errors,
    cause: error,
  });
};

export default validationErrorMapper;

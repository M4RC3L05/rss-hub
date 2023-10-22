import { type RouterContext } from "@koa/router";
import { type Next } from "koa";
import type Ajv from "ajv";
import { RequestValidationError } from "../errors/mod.js";
import type validator from "../validator/mod.js";

type ErrorMapperDeps = {
  validator: typeof validator;
  schemas: {
    request: {
      query?: { $id: string };
      params?: { $id: string };
      body?: { $id: string };
    };
  };
};

type DataToValidate = {
  hasErrors: boolean;
  request: {
    query?: {
      data: unknown;
      schema: { $id: string };
      errors?: Ajv.ErrorObject[];
    };
    params?: {
      data: unknown;
      schema: { $id: string };
      errors?: Ajv.ErrorObject[];
    };
    body?: {
      data: unknown;
      schema: { $id: string };
      errors?: Ajv.ErrorObject[];
    };
  };
};

const getData = (key: string, ctx: RouterContext) => {
  if (key === "query") return ctx.query;
  if (key === "params") return ctx.params;
  if (key === "body") return ctx.request.body;
};

const requestValidator = (deps: ErrorMapperDeps) => {
  return async (ctx: RouterContext, next: Next) => {
    const dataToValidate: DataToValidate = {
      hasErrors: false,
      request: {},
    };

    for (const [key, schema] of Object.entries(deps.schemas.request)) {
      dataToValidate.request[key as keyof typeof dataToValidate.request] = {
        data: getData(key, ctx),
        schema,
      };
    }

    for (const [key, toValidate] of Object.entries(dataToValidate.request)) {
      const validate = deps.validator.getSchema(toValidate.schema.$id);

      if (!validate) throw new Error(`No schema found for "${toValidate.schema.$id}"`);

      if (!validate(toValidate.data)) {
        dataToValidate.hasErrors = true;
        dataToValidate.request[key as keyof typeof dataToValidate.request]!.errors =
          validate.errors!;
      }
    }

    if (dataToValidate.hasErrors) {
      const options = { request: {} };

      for (const [key, { errors }] of Object.entries(dataToValidate.request)) {
        if (!errors) continue;

        Object.assign(options.request, { [key]: errors });
      }

      throw new RequestValidationError(
        options as ConstructorParameters<typeof RequestValidationError>[0],
      );
    }

    return next();
  };
};

export default requestValidator;

import createHttpError from "http-errors";

const defaultErrorMapper = (_error: unknown) => {
  return createHttpError(500, "Something went wrong");
};

export default defaultErrorMapper;

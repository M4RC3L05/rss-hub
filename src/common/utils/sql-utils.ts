import sql, { type Query } from "@leafac/sqlite";

export const join = (values: unknown[], glue = sql`, `) =>
  // eslint-disable-next-line unicorn/no-array-reduce
  values.reduce(
    (acc, curr, index, array) =>
      sql`$${acc}$${index === 0 || index === array.length ? sql`` : glue}$${
        isQuery(curr) ? sql`$${curr}` : sql`${curr}`
      }`,
    sql``,
  );

export const isQuery = (value: any): value is Query => {
  return (
    typeof value === "object" &&
    Array.isArray(value?.sourceParts) &&
    Array.isArray(value?.parameters)
  );
};

/**
 * Validation middleware using Zod schemas
 * Supports validation for req.body, req.params, and req.query
 * 
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'params' | 'query'} [source='body']
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;

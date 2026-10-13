import type { Request, RequestHandler, Response } from "express";
import type { z, ZodType } from "zod";

export interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

type Infer<T> = T extends ZodType ? z.infer<T> : undefined;

export interface HandlerInput<S extends RequestSchemas> {
  body: Infer<S["body"]>;
  query: Infer<S["query"]>;
  params: Infer<S["params"]>;
  req: Request;
  res: Response;
}

/**
 * Validates the request against the given schemas and hands the parsed values
 * to the handler. Whatever the handler returns is sent as JSON, so handlers
 * stay free of response plumbing. Returning undefined sends 204.
 */
export function route<S extends RequestSchemas>(
  schemas: S,
  handler: (input: HandlerInput<S>) => unknown,
  status = 200,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const input = {
        body: schemas.body ? schemas.body.parse(req.body) : undefined,
        // req.query is getter-only in Express 5, so parsed values never
        // overwrite it; handlers read them from here instead.
        query: schemas.query ? schemas.query.parse(req.query) : undefined,
        params: schemas.params ? schemas.params.parse(req.params) : undefined,
        req,
        res,
      } as HandlerInput<S>;

      const result = await handler(input);

      if (res.headersSent) return;
      if (result === undefined) {
        res.status(204).end();
        return;
      }
      res.status(status).json(result);
    } catch (error) {
      next(error);
    }
  };
}

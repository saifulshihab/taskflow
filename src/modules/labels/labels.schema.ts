import { z } from "zod";

export const labelIdParams = z.object({
  labelId: z.uuid(),
});

export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color such as #6b7280")
    .default("#6b7280"),
});

export const updateLabelSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field");

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

import { z } from "zod";

export const ListErrorsKindInputSchema = z.object({
    query: z.string(),
    kind: z.string(),
    status: z.string(),
    orderBy: z.string(),
  });

export const ListErrorsInputSchema = z.object({
  query: ListErrorsKindInputSchema,
});

export type ListErrorsInput = z.infer<typeof ListErrorsInputSchema>;

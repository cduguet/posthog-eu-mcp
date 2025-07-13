import { z } from "zod";
const base = ["exact", "is_not"];
const stringOps = [
    ...base,
    "icontains",
    "not_icontains",
    "regex",
    "not_regex",
    "is_cleaned_path_exact",
];
const numberOps = [...base, "gt", "gte", "lt", "lte", "min", "max"];
const booleanOps = [...base];
const arrayOps = ["in", "not_in"];
const operatorSchema = z.enum([
    ...stringOps,
    ...numberOps,
    ...booleanOps,
    ...arrayOps,
]);
export const PersonPropertyFilterSchema = z
    .object({
    key: z.string(),
    value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.array(z.string()),
        z.array(z.number()),
    ]),
    operator: operatorSchema.optional(),
})
    .superRefine((data, ctx) => {
    const { value, operator } = data;
    if (!operator)
        return;
    const isArray = Array.isArray(value);
    const valid = (typeof value === "string" && stringOps.includes(operator)) ||
        (typeof value === "number" && numberOps.includes(operator)) ||
        (typeof value === "boolean" && booleanOps.includes(operator)) ||
        (isArray && arrayOps.includes(operator));
    if (!valid)
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `operator "${operator}" is not valid for value type "${isArray ? "array" : typeof value}"`,
        });
    if (!isArray && arrayOps.includes(operator))
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `operator "${operator}" requires an array value`,
        });
})
    .transform((data) => {
    return {
        ...data,
        type: "person",
    };
});
export const FiltersSchema = z.object({
    properties: z.array(PersonPropertyFilterSchema),
    rollout_percentage: z.number(),
});
export const FilterGroupsSchema = z.object({
    groups: z.array(FiltersSchema),
});
export const CreateFeatureFlagInputSchema = z.object({
    name: z.string(),
    key: z.string(),
    description: z.string(),
    filters: FilterGroupsSchema,
    active: z.boolean(),
    tags: z.array(z.string()).optional(),
});
export const UpdateFeatureFlagInputSchema = CreateFeatureFlagInputSchema.omit({
    key: true,
}).partial();
export const FeatureFlagSchema = z.object({
    id: z.number(),
    key: z.string(),
    name: z.string(),
    description: z.string().optional(),
    filters: FiltersSchema.optional(),
    active: z.boolean(),
    tags: z.array(z.string()).optional(),
});

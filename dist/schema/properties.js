import { ApiPropertyDefinitionSchema } from "./api";
export const PropertyDefinitionSchema = ApiPropertyDefinitionSchema.pick({
    name: true,
    property_type: true,
});

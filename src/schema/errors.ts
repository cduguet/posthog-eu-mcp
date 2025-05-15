import { z } from "zod";

export enum OrderByErrors {
	Occurrences = "occurrences",
	FirstSeen = "first_seen",
	LastSeen = "last_seen",
	Users = "users",
	Sessions = "sessions",
}

export const ListErrorsSchema = z.object({
	orderBy: z.nativeEnum(OrderByErrors).optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
});

export type ListErrorsData = z.infer<typeof ListErrorsSchema>;

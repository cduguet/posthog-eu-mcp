import { z } from "zod";

export enum OrderByErrors {
	Occurrences = "occurrences",
	FirstSeen = "first_seen",
	LastSeen = "last_seen",
	Users = "users",
	Sessions = "sessions",
}

export enum OrderDirectionErrors {
	Ascending = "ASC",
	Descending = "DESC",
}

export enum StatusErrors {
	Active = "active",
	Resolved = "resolved",
	All = "all",
	Suppressed = "suppressed",
}

export const ListErrorsSchema = z.object({
	orderBy: z.nativeEnum(OrderByErrors).optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
	orderDirection: z.nativeEnum(OrderDirectionErrors).optional(),
	filterTestAccounts: z.boolean().optional(),
	limit: z.number().optional(),
	status: z.nativeEnum(StatusErrors).optional(),
	// TODO: assigned to
});

export type ListErrorsData = z.infer<typeof ListErrorsSchema>;

import { z } from "zod";
export var OrderByErrors;
(function (OrderByErrors) {
    OrderByErrors["Occurrences"] = "occurrences";
    OrderByErrors["FirstSeen"] = "first_seen";
    OrderByErrors["LastSeen"] = "last_seen";
    OrderByErrors["Users"] = "users";
    OrderByErrors["Sessions"] = "sessions";
})(OrderByErrors || (OrderByErrors = {}));
export var OrderDirectionErrors;
(function (OrderDirectionErrors) {
    OrderDirectionErrors["Ascending"] = "ASC";
    OrderDirectionErrors["Descending"] = "DESC";
})(OrderDirectionErrors || (OrderDirectionErrors = {}));
export var StatusErrors;
(function (StatusErrors) {
    StatusErrors["Active"] = "active";
    StatusErrors["Resolved"] = "resolved";
    StatusErrors["All"] = "all";
    StatusErrors["Suppressed"] = "suppressed";
})(StatusErrors || (StatusErrors = {}));
export const ListErrorsSchema = z.object({
    orderBy: z.nativeEnum(OrderByErrors).optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    orderDirection: z.nativeEnum(OrderDirectionErrors).optional(),
    filterTestAccounts: z.boolean().optional(),
    // limit: z.number().optional(),
    status: z.nativeEnum(StatusErrors).optional(),
    // TODO: assigned to
});
export const ErrorDetailsSchema = z.object({
    issueId: z.string(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
});

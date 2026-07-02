declare const moleResponse: unique symbol;

export type ApiResponse = Response & {
    readonly [moleResponse]: true;
};

const buildResponse = (body: unknown, code: number): ApiResponse => {
    return new Response(
        JSON.stringify(body),
        {
            status: code,
        },
    ) as ApiResponse;
};

export const allowPreflight = (): ApiResponse => {
    const body = { message: "OPTIONS accepted" };
    return buildResponse(body, 200);
};

export const success = (body: unknown): ApiResponse => {
    return buildResponse(body, 200);
};

export const accepted = (body?: unknown): ApiResponse => {
    return buildResponse(body ?? { message: "Accepted" }, 202);
};

export const badRequest = (errorMessage?: string): ApiResponse => {
    const body = { message: errorMessage ?? "Bad request" };
    return buildResponse(body, 400);
};

export const unauthorized = (errorMessage?: string): ApiResponse => {
    const body = { message: errorMessage ?? "Unauthorized" };
    return buildResponse(body, 401);
};

export const accessDenied = (errorMessage?: string): ApiResponse => {
    const body = { message: errorMessage ?? "Access Denied" };
    return buildResponse(body, 403);
};

export const notFound = (errorMessage?: string): ApiResponse => {
    const body = { message: errorMessage ?? "Not found" };
    return buildResponse(body, 404);
};

export const methodNotAllowed = (errorMessage?: string): ApiResponse => {
    const body = { message: errorMessage ?? "Method not allowed" };
    return buildResponse(body, 405);
};

export const internalError = (errorMessage?: string): ApiResponse => {
    const body = { message: errorMessage ?? "Internal Server Error" };
    return buildResponse(body, 500);
};

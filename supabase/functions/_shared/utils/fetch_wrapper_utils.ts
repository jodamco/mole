import "jsr:@supabase/functions-js@^2";
import {
    AuthModeWithKey,
    SupabaseContext,
    withSupabase,
} from "npm:@supabase/server@^1";
import {
    accessDenied,
    allowPreflight,
    ApiResponse,
    internalError,
} from "../types/response_types.ts";

/// Allow preflight requests by default on wrapped handlers
/// and wrap the code with a try catch for execution
function edgeFunctionWrapper<T>(
    req: Request,
    ctx: SupabaseContext<T>,
    handler: (req: Request, ctx: SupabaseContext<T>) => Promise<ApiResponse>,
) {
    try {
        if (req.method === "OPTIONS") return allowPreflight();
        return handler(req, ctx);
    } catch (error: unknown) {
        let message = undefined;
        if (error instanceof Error) {
            message = error.message;
        }
        return internalError(message);
    }
}

export function customFetchWrapper<T>(
    handler: (req: Request, ctx: SupabaseContext<T>) => Promise<ApiResponse>,
    auth: AuthModeWithKey | AuthModeWithKey[] = "user",
) {
    return withSupabase<T>(
        { auth: auth },
        async (req, ctx) => await edgeFunctionWrapper<T>(req, ctx, handler),
    );
}

export async function getUserId<T>(
    ctx: SupabaseContext<T>,
): Promise<{ id?: string; error?: ApiResponse }> {
    const supabase = ctx.supabase;

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) return { error: accessDenied() };

    const userId = user?.id;

    if (!userId) return { error: accessDenied() };

    return { id: userId };
}

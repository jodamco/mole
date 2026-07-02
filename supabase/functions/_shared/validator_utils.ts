export function isEmpty(obj: unknown): boolean {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === "string") return obj.trim().length === 0;
    if (typeof obj === "object") return Object.keys(obj).length === 0;
    return false;
}

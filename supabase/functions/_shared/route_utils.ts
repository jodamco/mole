export const getIdFromPath = (req: Request): number | null => {
    const segments = new URL(req.url).pathname
        .split("/")
        .filter(Boolean);

    const last = segments.at(-1);

    if (!last) return null;

    const id = Number(last);

    return Number.isInteger(id) ? id : null;
};

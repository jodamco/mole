export interface MockResult<T = unknown> {
  data: T | null;
  error: unknown;
}

export function mockResult<T>(data: T, error: unknown = null): MockResult<T> {
  return { data, error };
}

export function mockError(error?: unknown): MockResult<null> {
  return { data: null, error: error ?? { message: "Database error" } };
}

interface MockQueryBuilder<T> {
  data: T | null;
  error: unknown;
  select: (columns?: string) => MockQueryBuilder<T>;
  insert: (values: unknown) => MockQueryBuilder<T>;
  update: (values: unknown) => MockQueryBuilder<T>;
  delete: () => MockQueryBuilder<T>;
  eq: (column: string, value: unknown) => MockQueryBuilder<T>;
  is: (column: string, value: unknown) => MockQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder<T>;
  single: () => MockQueryBuilder<T>;
  then: <TResult1 = MockResult<T>, TResult2 = never>(
    onfulfilled?: ((value: MockResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise<TResult1 | TResult2>;
}

function mockQuery<T>(result: MockResult<T>): MockQueryBuilder<T> {
  return {
    data: result.data,
    error: result.error,
    select: () => mockQuery(result),
    insert: () => mockQuery(result),
    update: () => mockQuery(result),
    delete: () => mockQuery(result),
    eq: () => mockQuery(result),
    is: () => mockQuery(result),
    order: () => mockQuery(result),
    single: () => mockQuery(result),
    then: (onfulfilled, onrejected) =>
      Promise.resolve(result).then(onfulfilled, onrejected),
  };
}

interface MockSupabaseOptions {
  collections?: MockResult | MockResult[];
  documents?: MockResult | MockResult[];
  users?: MockResult | MockResult[];
  document_status?: MockResult | MockResult[];
  chunking_strategy?: MockResult | MockResult[];
  storage?: MockResult | MockResult[];
  default?: MockResult | MockResult[];
}

export function createMockSupabase(options: MockSupabaseOptions = {}) {
  const { default: def = mockResult(null), ...rest } = options;
  const counters: Record<string, number> = {};

  const source: Record<string, MockResult | MockResult[]> = { ...rest };
  source.__storage = options.storage ?? def;
  source.__default = def;

  function pick(table: string): MockResult {
    const raw = source[table] ?? source.__default;
    const results = Array.isArray(raw) ? raw : [raw];
    const idx = (counters[table] ?? 0) % results.length;
    counters[table] = idx + 1;
    return results[idx];
  }

  return {
    from: (table: string) => mockQuery(pick(table)),
    storage: {
      from: () => ({
        createSignedUploadUrl: (
          _path: string,
          _opts?: Record<string, unknown>,
        ) => Promise.resolve(pick("__storage")),
        remove: (_paths: string[]) => Promise.resolve(pick("__storage")),
      }),
    },
  };
}

export function createRequest(
  method: string,
  path: string = "/",
  body?: Record<string, unknown>,
): Request {
  const url = `http://localhost${path}`;
  const init: RequestInit = { method };
  if (body) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  return new Request(url, init);
}

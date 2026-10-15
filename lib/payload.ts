// Helpers for JSON payloads whose shape isn't guaranteed (they come from butler-da).

export type JsonResponse = { status: number; payload: unknown };

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readString = ({ payload, key }: { payload: unknown; key: string }) => {
  const value = isRecord(payload) ? payload[key] : undefined;
  return typeof value === 'string' ? value : undefined;
};

export function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const parsedValue = Number(trimmed);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
}

export function toNumberInputValue(value?: number | null): number | "" {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

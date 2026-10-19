import { useSearchParams } from "next/navigation";

export function useRawSearchParams() {
  const searchParams = useSearchParams();
  const raw: Record<string, string | string[] | undefined> = {};
  searchParams.forEach((value, key) => {
    const existing = raw[key];
    if (existing === undefined) raw[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else raw[key] = [existing, value];
  });
  return raw;
}

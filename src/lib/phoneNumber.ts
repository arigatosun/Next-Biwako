export function normalizePhoneNumber(value: string): string {
  return value
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    )
    .replace(/[ー－―‐‑–—]/g, "-")
    .replace(/[^0-9-]/g, "");
}

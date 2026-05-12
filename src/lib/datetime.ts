// Indian Standard Time helpers (UTC+5:30, no DST).
const IST_TZ = "Asia/Kolkata";
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function formatIST(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }
): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: IST_TZ }).format(d) + " IST";
}

export function formatISTShort(value: string | Date | null | undefined): string {
  return formatIST(value, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Convert an ISO/UTC date to a value usable in <input type="datetime-local"> as IST wall-clock. */
export function isoToISTLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 16);
}

/** Convert a datetime-local value (interpreted as IST wall-clock) back to a UTC ISO string. */
export function istLocalInputToISO(local: string): string | null {
  if (!local) return null;
  // local is "YYYY-MM-DDTHH:mm" — treat it as IST and produce real UTC ISO.
  const utcMs = Date.parse(local + ":00Z") - IST_OFFSET_MS;
  if (isNaN(utcMs)) return null;
  return new Date(utcMs).toISOString();
}

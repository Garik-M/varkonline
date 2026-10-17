export const CHANNEL = "varkonline.financing";
export const VERSION = 1;
export type FrameEvent =
  | "ready"
  | "loaded"
  | "resize"
  | "calculated"
  | "changed"
  | "error";
export function isFrameMessage(value: unknown): value is {
  channel: typeof CHANNEL;
  version: 1;
  instance: string;
  type: FrameEvent;
  height?: number;
  code?: string;
} {
  if (value === null || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    data.channel === CHANNEL &&
    data.version === VERSION &&
    typeof data.instance === "string" &&
    typeof data.type === "string" &&
    ["ready", "loaded", "resize", "calculated", "changed", "error"].includes(
      data.type,
    )
  );
}

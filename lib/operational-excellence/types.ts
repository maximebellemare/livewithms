export type OperationalErrorCategory =
  | "network"
  | "offline"
  | "sync"
  | "storage"
  | "auth"
  | "ai"
  | "unknown";

export type ResourcePressure = "normal" | "constrained";

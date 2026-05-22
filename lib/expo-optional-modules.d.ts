declare module "expo-print" {
  export function printToFileAsync(options: { html: string }): Promise<{ uri: string }>;
}

declare module "expo-sharing" {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(uri: string): Promise<void>;
}

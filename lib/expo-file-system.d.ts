declare module "expo-file-system" {
  export const cacheDirectory: string | null;

  export const EncodingType: {
    Base64: "base64";
    UTF8: "utf8";
  };

  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: {
      encoding?: "base64" | "utf8";
    },
  ): Promise<void>;
}

declare module "expo-image-picker" {
  export const MediaTypeOptions: {
    Images: "Images";
  };

  export type ImagePickerAsset = {
    uri: string;
  };

  export type ImagePickerResult = {
    canceled: boolean;
    assets?: ImagePickerAsset[];
  };

  export type PermissionResponse = {
    granted: boolean;
  };

  export function requestCameraPermissionsAsync(): Promise<PermissionResponse>;
  export function requestMediaLibraryPermissionsAsync(): Promise<PermissionResponse>;
  export function launchCameraAsync(options?: Record<string, unknown>): Promise<ImagePickerResult>;
  export function launchImageLibraryAsync(options?: Record<string, unknown>): Promise<ImagePickerResult>;
}

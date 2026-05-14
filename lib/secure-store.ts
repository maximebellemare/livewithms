import * as SecureStore from "expo-secure-store";

const VALID_KEY_PATTERN = /[^A-Za-z0-9._-]/g;

export function sanitizeSecureStoreKey(key: string) {
  return key.replace(VALID_KEY_PATTERN, "_");
}

export const appSecureStore = {
  getItem(key: string) {
    return SecureStore.getItemAsync(sanitizeSecureStoreKey(key));
  },
  setItem(key: string, value: string) {
    return SecureStore.setItemAsync(sanitizeSecureStoreKey(key), value);
  },
  deleteItem(key: string) {
    return SecureStore.deleteItemAsync(sanitizeSecureStoreKey(key));
  },
};

import { appSecureStore } from "../secure-store";

export const authStorage = {
  getItem: (key: string) => appSecureStore.getItem(key),
  setItem: (key: string, value: string) => appSecureStore.setItem(key, value),
  removeItem: (key: string) => appSecureStore.deleteItem(key),
};

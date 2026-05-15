import type { ContinuityDeviceSurface } from "../types";

export function deriveDeviceCapabilities(surface: ContinuityDeviceSurface) {
  switch (surface) {
    case "watch":
      return { glanceable: true, reflectionDepth: "minimal", lowEnergyFriendly: true };
    case "phone":
      return { glanceable: false, reflectionDepth: "medium", lowEnergyFriendly: true };
    case "tablet":
    case "web":
      return { glanceable: false, reflectionDepth: "spacious", lowEnergyFriendly: false };
    case "audio":
      return { glanceable: false, reflectionDepth: "brief", lowEnergyFriendly: true };
  }
}

export function reduceCrossDevicePrompting(input: {
  hasRecentPrompt: boolean;
  deviceCount: number;
}) {
  return input.hasRecentPrompt || input.deviceCount > 1;
}

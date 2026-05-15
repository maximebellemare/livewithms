export function reduceSupportNoise(lines: string[], maxLines: number) {
  return lines.filter(Boolean).slice(0, maxLines).join(" ");
}

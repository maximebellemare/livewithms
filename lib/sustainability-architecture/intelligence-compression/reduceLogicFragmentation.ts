export function reduceLogicFragmentation(input: {
  primitives: string[];
  orchestrationLayers: string[];
}) {
  const uniquePrimitives = Array.from(new Set(input.primitives));
  const uniqueLayers = Array.from(new Set(input.orchestrationLayers));

  return {
    primitiveCount: uniquePrimitives.length,
    layerCount: uniqueLayers.length,
    compressed: uniquePrimitives.length <= input.primitives.length && uniqueLayers.length <= input.orchestrationLayers.length,
  };
}

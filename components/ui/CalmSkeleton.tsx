import { StyleSheet, View } from "react-native";
import { colors, radii } from "./design";

type CalmSkeletonProps = {
  width?: number | `${number}%` | "100%";
  height?: number;
  radius?: number;
};

export default function CalmSkeleton({
  width = "100%",
  height = 14,
  radius = radii.pill,
}: CalmSkeletonProps) {
  return <View style={[styles.block, { width, height, borderRadius: radius }]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.accentSoft,
    opacity: 0.85,
  },
});

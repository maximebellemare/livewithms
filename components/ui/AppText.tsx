import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
import { colors } from "./design";

type AppTextProps = PropsWithChildren<{
  style?: StyleProp<TextStyle>;
}> &
  Pick<TextProps, "numberOfLines" | "maxFontSizeMultiplier">;

export default function AppText({
  children,
  style,
  numberOfLines,
  maxFontSizeMultiplier = 1.8,
}: AppTextProps) {
  const calmEnvironment = useDerivedCalmEnvironment();
  const spaciousReading = calmEnvironment.readability.spaciousReading;
  const simplifiedReading = calmEnvironment.lowEnergyPresentation.shortenReading;

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={spaciousReading ? Math.max(maxFontSizeMultiplier, 2) : maxFontSizeMultiplier}
      numberOfLines={numberOfLines}
      style={[
        styles.text,
        spaciousReading && styles.textSpacious,
        simplifiedReading && styles.textSimplified,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.textBody,
    fontSize: 16,
    lineHeight: 24,
  },
  textSpacious: {
    lineHeight: 26,
  },
  textSimplified: {
    lineHeight: 25,
  },
});

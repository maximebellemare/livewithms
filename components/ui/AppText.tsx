import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { useCalmEnvironment, useDerivedCalmEnvironment } from "../../features/calm-environment/hooks";
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
  const appearance = useCalmEnvironment().appearance;
  const calmEnvironment = useDerivedCalmEnvironment();
  const spaciousReading = calmEnvironment.readability.spaciousReading;
  const simplifiedReading = calmEnvironment.lowEnergyPresentation.shortenReading;
  const darkMode = appearance === "dark";

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={spaciousReading ? Math.max(maxFontSizeMultiplier, 2) : maxFontSizeMultiplier}
      numberOfLines={numberOfLines}
      style={[
        styles.text,
        darkMode && styles.textDark,
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
  textDark: {
    color: colors.textBodyDark,
  },
  textSpacious: {
    lineHeight: 26,
  },
  textSimplified: {
    lineHeight: 25,
  },
});

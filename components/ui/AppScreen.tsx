import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "./AppText";

type AppScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export default function AppScreen({ children, title, subtitle }: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {title || subtitle ? (
          <View style={styles.header}>
            {title ? <AppText style={styles.title}>{title}</AppText> : null}
            {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
          </View>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff7f2",
  },
  container: {
    flex: 1,
    paddingTop: 24,
  },
  header: {
    paddingHorizontal: 20,
    gap: 8,
  },
  title: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
});

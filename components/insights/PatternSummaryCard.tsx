import { StyleSheet, View } from "react-native";
import AppText from "../ui/AppText";

type PatternSummaryCardProps = {
  title?: string;
  summary: string;
};

export default function PatternSummaryCard({
  title = "Pattern summary",
  summary,
}: PatternSummaryCardProps) {
  return (
    <View style={styles.card}>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.body}>{summary}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff1e6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f2d3bd",
    padding: 18,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  body: {
    color: "#7c4a1d",
  },
});

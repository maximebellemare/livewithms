import { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import ReflectionCard from "./ReflectionCard";
import type { ReflectionSurfaceCard as ReflectionSurfaceCardModel } from "../../lib/reflection-surfaces/types";

type ReflectionSurfaceStackProps = {
  cards: ReflectionSurfaceCardModel[];
  reducedMotion?: boolean;
  gap?: number;
  topMargin?: number;
  transitionDurationMs?: number;
};

function ReflectionSurfaceStack({
  cards,
  reducedMotion = false,
  gap = 12,
  topMargin = 0,
  transitionDurationMs = 220,
}: ReflectionSurfaceStackProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    if (!cards.length) {
      return;
    }

    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: transitionDurationMs,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: transitionDurationMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cards.length, opacity, transitionDurationMs, translateY]);

  if (!cards.length) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity, gap, marginTop: topMargin, transform: [{ translateY }] }]}>
      <View style={styles.header}>
        <ReflectionCard card={cards[0]} />
      </View>
      {cards.slice(1).map((card) => (
        <ReflectionCard key={card.id} card={card} />
      ))}
    </Animated.View>
  );
}

export default memo(ReflectionSurfaceStack);

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    gap: 12,
  },
});

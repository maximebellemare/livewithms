import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type AppTourSlide = {
  id: string;
  title: string;
  body: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

export const APP_TOUR_SLIDES: AppTourSlide[] = [
  {
    id: "today",
    title: "Today",
    body: "Start here each day to check in, plan your day, and see practical support.",
    icon: "home-outline",
  },
  {
    id: "insights",
    title: "Insights",
    body: "See patterns in fatigue, mood, sleep, symptoms, and recovery over time.",
    icon: "bulb-outline",
  },
  {
    id: "coach",
    title: "Coach",
    body: "Ask for help organizing thoughts, planning, pacing, or finding the right support.",
    icon: "chatbubble-ellipses-outline",
  },
  {
    id: "programs",
    title: "Programs",
    body: "Use guided tools and exercises for brain fog, stress, fatigue, and focus.",
    icon: "sparkles-outline",
  },
  {
    id: "community",
    title: "Community",
    body: "Read discussions, ask questions, and learn from shared experiences.",
    icon: "people-outline",
  },
  {
    id: "care",
    title: "Care",
    body: "Keep medications, appointments, health summaries, and nutrition support in one place.",
    icon: "medical-outline",
  },
  {
    id: "nutrition",
    title: "Nutrition",
    body: "Build meal plans, find food swaps, and get low-energy meal ideas.",
    icon: "restaurant-outline",
  },
];

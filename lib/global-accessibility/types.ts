export type GlobalLocaleHint = "global" | "direct" | "gentle";

export type LocalizedTone = {
  summary: string;
  preferShortSentences: boolean;
  avoidClinicalLiteralism: boolean;
  softenAuthority: boolean;
};

export type ReadingMode = {
  mode: "standard" | "reduced" | "minimal";
  summary: string;
};

export type DeviceDataSource = "apple-health" | "manual-import";

export type SleepSample = {
  source: DeviceDataSource;
  startAt: string;
  endAt: string;
  hours: number;
};

export type StepCountSample = {
  source: DeviceDataSource;
  date: string;
  count: number;
};

export type HeartRateSample = {
  source: DeviceDataSource;
  recordedAt: string;
  bpm: number;
};

export type DeviceDataAdapter = {
  source: DeviceDataSource;
  isAvailable: () => Promise<boolean>;
  getRecentSleep?: (days: number) => Promise<SleepSample[]>;
  getRecentSteps?: (days: number) => Promise<StepCountSample[]>;
  getRecentHeartRate?: (days: number) => Promise<HeartRateSample[]>;
};

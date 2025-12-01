import { SetMetadata } from '@nestjs/common';

export const TRACK_USAGE_KEY = 'trackUsage';
export const TrackUsage = (feature: string) =>
  SetMetadata(TRACK_USAGE_KEY, feature);

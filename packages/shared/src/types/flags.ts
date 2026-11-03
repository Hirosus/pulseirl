import { z } from 'zod';

export const FeatureFlagConfigSchema = z.object({
  key: z.string().min(1),
  rolloutPercentage: z.number().min(0).max(100),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  whitelistUsers: z.array(z.string()).optional()
});

export type FeatureFlagConfig = z.infer<typeof FeatureFlagConfigSchema>;

export interface ExperimentVariantAssignment {
  flagKey: string;
  userId: string;
  variant: 'A' | 'B';
  inExperiment: boolean;
}

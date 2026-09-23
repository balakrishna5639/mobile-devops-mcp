import { z } from 'zod';

// ─── Input / Output Types ────────────────────────────────────────────

export const IOSSigningInputSchema = z.object({
  certificateType: z.enum(['development', 'distribution', 'adhoc']),
  bundleId: z
    .string()
    .min(1, 'bundleId is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/, 'Invalid bundle identifier format'),
  teamId: z.string().optional(),
});

export type IOSSigningInput = z.infer<typeof IOSSigningInputSchema>;

export interface IOSSigningResult {
  certificateType: string;
  bundleId: string;
  teamId: string;
  buildConfig: Record<string, unknown>;
  instructions: string[];
}

// ─── Core Logic ──────────────────────────────────────────────────────

export function setupIOSSigning(raw: IOSSigningInput): IOSSigningResult {
  const input = IOSSigningInputSchema.parse(raw);
  const teamId = input.teamId ?? 'YOUR_TEAM_ID';

  const isRelease = input.certificateType === 'distribution' || input.certificateType === 'adhoc';

  const packageTypeMap: Record<string, string> = {
    development: 'development',
    distribution: 'app-store',
    adhoc: 'ad-hoc',
  };

  const codeSignIdentityMap: Record<string, string> = {
    development: 'iPhone Developer',
    distribution: 'iPhone Distribution',
    adhoc: 'iPhone Distribution',
  };

  const buildConfig = {
    ios: {
      [isRelease ? 'release' : 'debug']: {
        codeSignIdentity: codeSignIdentityMap[input.certificateType],
        developmentTeam: teamId,
        packageType: packageTypeMap[input.certificateType],
        provisioningProfile: 'AUTO',
      },
    },
  };

  const buildFlag = isRelease ? '--release' : '--debug';

  return {
    certificateType: input.certificateType,
    bundleId: input.bundleId,
    teamId,
    buildConfig,
    instructions: [
      'Open Xcode → Settings → Accounts',
      `Add your Apple ID and select team: ${teamId}`,
      `Download ${input.certificateType} certificates`,
      `Create ${input.certificateType} provisioning profile for ${input.bundleId}`,
      'Save the build.json configuration in your project root',
      `Build with: cordova build ios ${buildFlag} --device`,
      'Verify signing in Xcode → Signing & Capabilities',
      'Test on a physical device before submission',
    ],
  };
}

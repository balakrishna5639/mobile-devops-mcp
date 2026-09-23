import { describe, it, expect } from 'vitest';
import { setupIOSSigning, IOSSigningInputSchema } from '../ios-signing.js';

describe('IOSSigningInputSchema', () => {
  it('validates a correct input', () => {
    const result = IOSSigningInputSchema.safeParse({
      certificateType: 'distribution',
      bundleId: 'com.example.app',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid certificateType', () => {
    const result = IOSSigningInputSchema.safeParse({
      certificateType: 'invalid',
      bundleId: 'com.example.app',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid bundleId format', () => {
    const result = IOSSigningInputSchema.safeParse({
      certificateType: 'development',
      bundleId: 'bad-id',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional teamId', () => {
    const result = IOSSigningInputSchema.safeParse({
      certificateType: 'development',
      bundleId: 'com.example.app',
    });
    expect(result.success).toBe(true);
  });
});

describe('setupIOSSigning', () => {
  it('generates distribution config', () => {
    const result = setupIOSSigning({
      certificateType: 'distribution',
      bundleId: 'com.example.app',
      teamId: 'TEAM123',
    });

    expect(result.buildConfig).toEqual({
      ios: {
        release: {
          codeSignIdentity: 'iPhone Distribution',
          developmentTeam: 'TEAM123',
          packageType: 'app-store',
          provisioningProfile: 'AUTO',
        },
      },
    });
    expect(result.certificateType).toBe('distribution');
    expect(result.bundleId).toBe('com.example.app');
    expect(result.teamId).toBe('TEAM123');
  });

  it('generates development config', () => {
    const result = setupIOSSigning({
      certificateType: 'development',
      bundleId: 'com.example.app',
      teamId: 'TEAM123',
    });

    expect(result.buildConfig).toEqual({
      ios: {
        debug: {
          codeSignIdentity: 'iPhone Developer',
          developmentTeam: 'TEAM123',
          packageType: 'development',
          provisioningProfile: 'AUTO',
        },
      },
    });
  });

  it('generates adhoc config', () => {
    const result = setupIOSSigning({
      certificateType: 'adhoc',
      bundleId: 'com.example.app',
      teamId: 'TEAM123',
    });

    expect(result.buildConfig).toEqual({
      ios: {
        release: {
          codeSignIdentity: 'iPhone Distribution',
          developmentTeam: 'TEAM123',
          packageType: 'ad-hoc',
          provisioningProfile: 'AUTO',
        },
      },
    });
  });

  it('defaults teamId to YOUR_TEAM_ID when not provided', () => {
    const result = setupIOSSigning({
      certificateType: 'development',
      bundleId: 'com.example.app',
    });

    expect(result.teamId).toBe('YOUR_TEAM_ID');
    const config = result.buildConfig as any;
    expect(config.ios.debug.developmentTeam).toBe('YOUR_TEAM_ID');
  });

  it('returns correct number of instructions', () => {
    const result = setupIOSSigning({
      certificateType: 'distribution',
      bundleId: 'com.example.app',
      teamId: 'TEAM123',
    });

    expect(result.instructions.length).toBeGreaterThanOrEqual(6);
    expect(result.instructions.some((i) => i.includes('cordova build'))).toBe(true);
  });

  it('includes --release flag for distribution', () => {
    const result = setupIOSSigning({
      certificateType: 'distribution',
      bundleId: 'com.example.app',
    });

    expect(result.instructions.some((i) => i.includes('--release'))).toBe(true);
  });

  it('includes --debug flag for development', () => {
    const result = setupIOSSigning({
      certificateType: 'development',
      bundleId: 'com.example.app',
    });

    expect(result.instructions.some((i) => i.includes('--debug'))).toBe(true);
  });
});

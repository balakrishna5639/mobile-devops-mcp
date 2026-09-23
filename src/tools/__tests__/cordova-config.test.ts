import { describe, it, expect } from 'vitest';
import { generateCordovaConfig, CordovaConfigInputSchema } from '../cordova-config.js';

describe('CordovaConfigInputSchema', () => {
  it('validates a correct input', () => {
    const result = CordovaConfigInputSchema.safeParse({
      appName: 'Test App',
      packageId: 'com.test.app',
      platforms: ['android'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty appName', () => {
    const result = CordovaConfigInputSchema.safeParse({
      appName: '',
      packageId: 'com.test.app',
      platforms: ['android'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid packageId format', () => {
    const result = CordovaConfigInputSchema.safeParse({
      appName: 'Test',
      packageId: 'not-a-valid-id',
      platforms: ['android'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty platforms array', () => {
    const result = CordovaConfigInputSchema.safeParse({
      appName: 'Test',
      packageId: 'com.test.app',
      platforms: [],
    });
    expect(result.success).toBe(false);
  });

  it('defaults minSdkVersion to 24', () => {
    const result = CordovaConfigInputSchema.parse({
      appName: 'Test',
      packageId: 'com.test.app',
      platforms: ['android'],
    });
    expect(result.minSdkVersion).toBe(24);
  });
});

describe('generateCordovaConfig', () => {
  const baseInput = {
    appName: 'My App',
    packageId: 'com.example.myapp',
    platforms: ['android' as const, 'ios' as const],
    minSdkVersion: 24,
  };

  it('generates valid XML with both platforms', () => {
    const result = generateCordovaConfig(baseInput);

    expect(result.config).toContain('<?xml');
    expect(result.config).toContain('id="com.example.myapp"');
    expect(result.config).toContain('<name>My App</name>');
    expect(result.config).toContain('<platform name="android">');
    expect(result.config).toContain('<platform name="ios">');
    expect(result.platforms).toEqual(['android', 'ios']);
  });

  it('generates Android-only config', () => {
    const result = generateCordovaConfig({ ...baseInput, platforms: ['android'] });

    expect(result.config).toContain('<platform name="android">');
    expect(result.config).not.toContain('<platform name="ios">');
  });

  it('generates iOS-only config', () => {
    const result = generateCordovaConfig({ ...baseInput, platforms: ['ios'] });

    expect(result.config).not.toContain('<platform name="android">');
    expect(result.config).toContain('<platform name="ios">');
  });

  it('uses the specified minSdkVersion', () => {
    const result = generateCordovaConfig({ ...baseInput, minSdkVersion: 28 });
    expect(result.config).toContain('android-minSdkVersion" value="28"');
    expect(result.features[0]).toContain('min: 28');
  });

  it('escapes XML-injection in appName', () => {
    const result = generateCordovaConfig({
      ...baseInput,
      appName: '</name><evil>attack</evil><name>',
    });

    expect(result.config).not.toContain('<evil>');
    expect(result.config).toContain('&lt;/name&gt;&lt;evil&gt;');
  });

  it('uses HTTPS-only access origin', () => {
    const result = generateCordovaConfig(baseInput);
    expect(result.config).toContain('origin="https://*"');
    expect(result.config).not.toContain('origin="*"');
  });

  it('returns correct features array', () => {
    const result = generateCordovaConfig(baseInput);
    expect(result.features).toHaveLength(4);
    expect(result.features[0]).toContain('min: 24');
    expect(result.features[1]).toContain('15.0');
  });

  it('returns a descriptive message', () => {
    const result = generateCordovaConfig(baseInput);
    expect(result.message).toContain('My App');
    expect(result.message).toContain('android, ios');
  });
});

import { z } from 'zod';
import { escapeXml } from './xml-utils.js';

// ─── Input / Output Types ────────────────────────────────────────────

export const CordovaConfigInputSchema = z.object({
  appName: z.string().min(1, 'appName is required'),
  packageId: z
    .string()
    .min(1, 'packageId is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/, 'Invalid package identifier format'),
  platforms: z
    .array(z.enum(['android', 'ios']))
    .min(1, 'At least one platform is required'),
  minSdkVersion: z.number().int().min(21).max(35).default(24),
});

export type CordovaConfigInput = z.infer<typeof CordovaConfigInputSchema>;

export interface CordovaConfigResult {
  config: string;
  message: string;
  platforms: string[];
  features: string[];
}

// ─── Core Logic ──────────────────────────────────────────────────────

export function generateCordovaConfig(raw: CordovaConfigInput): CordovaConfigResult {
  const input = CordovaConfigInputSchema.parse(raw);

  const safeName = escapeXml(input.appName);
  const safeId = escapeXml(input.packageId);
  const minSdk = input.minSdkVersion;

  const androidBlock = input.platforms.includes('android')
    ? `
    <platform name="android">
        <preference name="AndroidWindowSplashScreenAnimatedIcon" value="res/screen/android/splash.png" />
        <preference name="AndroidWindowSplashScreenBackground" value="#ffffff" />

        <icon density="ldpi" src="res/icon/android/icon-36-ldpi.png" />
        <icon density="mdpi" src="res/icon/android/icon-48-mdpi.png" />
        <icon density="hdpi" src="res/icon/android/icon-72-hdpi.png" />
        <icon density="xhdpi" src="res/icon/android/icon-96-xhdpi.png" />
        <icon density="xxhdpi" src="res/icon/android/icon-144-xxhdpi.png" />

        <allow-intent href="market:*" />
    </platform>`
    : '';

  const iosBlock = input.platforms.includes('ios')
    ? `
    <platform name="ios">
        <preference name="deployment-target" value="15.0" />
        <preference name="target-device" value="universal" />

        <icon height="57" src="res/icon/ios/icon-57.png" width="57" />
        <icon height="114" src="res/icon/ios/icon-57-2x.png" width="114" />
        <icon height="72" src="res/icon/ios/icon-72.png" width="72" />
        <icon height="144" src="res/icon/ios/icon-72-2x.png" width="144" />
        <icon height="180" src="res/icon/ios/icon-60-3x.png" width="180" />

        <allow-intent href="itms:*" />
        <allow-intent href="itms-apps:*" />
    </platform>`
    : '';

  const configXml = `<?xml version='1.0' encoding='utf-8'?>
<widget id="${safeId}" version="1.0.0" xmlns="http://www.w3.org/ns/widgets">
    <name>${safeName}</name>
    <description>${safeName} - Built with Mobile DevOps MCP Server</description>

    <author email="dev@company.com" href="https://company.com">Development Team</author>
    <content src="index.html" />

    <!-- Global Preferences -->
    <preference name="permissions" value="none" />
    <preference name="orientation" value="default" />
    <preference name="target-device" value="universal" />
    <preference name="fullscreen" value="true" />
    <preference name="webviewbounce" value="true" />

    <!-- Android Preferences -->
    <preference name="android-minSdkVersion" value="${minSdk}" />
    <preference name="android-targetSdkVersion" value="35" />
    <preference name="android-installLocation" value="auto" />
    ${androidBlock}
    ${iosBlock}

    <access origin="https://*" />
    <allow-navigation href="https://*" />
</widget>`;

  return {
    config: configXml,
    message: `Generated production-ready Cordova config.xml for ${input.appName} targeting ${input.platforms.join(', ')}`,
    platforms: input.platforms,
    features: [
      `Optimized Android SDK versions (min: ${minSdk}, target: 35)`,
      'iOS deployment target: 15.0+',
      'Platform-specific splash screens and icons',
      'Secure access origin (HTTPS only)',
    ],
  };
}

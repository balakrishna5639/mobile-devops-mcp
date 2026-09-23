import { Agent } from '@smythos/sdk';
import {
  generateCordovaConfig,
  diagnoseAndroidBuild,
  setupIOSSigning,
} from './tools/index.js';

async function main() {
  console.log('🚀 Starting Mobile DevOps Agent...');

  const agent = new Agent({
    name: 'Mobile DevOps Assistant',
    behavior: `Expert mobile development assistant specializing in Cordova/PhoneGap workflows. 
    Helps with Android and iOS build processes, code signing, app store deployment, and troubleshooting.`,
    model: 'gpt-4o',
  });

  // ── Skill: Cordova Config Generator ──────────────────────────────

  agent.addSkill({
    name: 'CordovaConfigGenerator',
    description: 'Generate optimized Cordova config.xml for Android/iOS deployment',
    process: async (input: { appName: string; packageId: string; platforms: ('android' | 'ios')[]; minSdkVersion?: number }) => {
      return generateCordovaConfig({
        appName: input.appName,
        packageId: input.packageId,
        platforms: input.platforms,
        minSdkVersion: input.minSdkVersion ?? 24,
      });
    },
  });

  // ── Skill: Android Build Diagnostic ──────────────────────────────

  agent.addSkill({
    name: 'AndroidBuildDiagnostic',
    description: 'Analyze Android build errors and provide solutions',
    process: async (input: { errorLog: string; gradleVersion?: string; targetSdkVersion?: number }) => {
      return diagnoseAndroidBuild(input);
    },
  });

  // ── Skill: iOS Signing Helper ────────────────────────────────────

  agent.addSkill({
    name: 'IOSSigningHelper',
    description: 'Configure iOS code signing certificates and provisioning profiles',
    process: async (input: { certificateType: 'development' | 'distribution' | 'adhoc'; bundleId: string; teamId?: string }) => {
      return setupIOSSigning(input);
    },
  });

  console.log('✅ Mobile DevOps Agent initialized with 3 specialized skills!');

  // ── Demo: Test all skills ────────────────────────────────────────

  console.log('\n📱 Testing Cordova Config Generation...');
  const configResult = await agent.call('CordovaConfigGenerator', {
    appName: 'SmythOS Mobile Demo',
    packageId: 'com.smythos.mobile.demo',
    platforms: ['android', 'ios'],
    minSdkVersion: 24,
  });
  console.log('Generated Config Features:', configResult.features);

  console.log('\n🔧 Testing Android Build Diagnostic...');
  const diagnosticResult = await agent.call('AndroidBuildDiagnostic', {
    errorLog:
      'AAPT: error: resource android:attr/lStar not found. Could not find method compile() for arguments',
    targetSdkVersion: 35,
  });
  console.log('Issues found:', diagnosticResult.issues.length);
  diagnosticResult.issues.forEach((i: { issue: string; solution: string }) => {
    console.log(`  🔴 ${i.issue}`);
    console.log(`     → ${i.solution}`);
  });

  console.log('\n🍎 Testing iOS Signing Helper...');
  const signingResult = await agent.call('IOSSigningHelper', {
    certificateType: 'distribution',
    bundleId: 'com.smythos.mobile.demo',
    teamId: 'ABCD123456',
  });
  console.log('Build Config:', JSON.stringify(signingResult.buildConfig, null, 2));

  console.log('\n🎯 Mobile DevOps MCP Server ready for SmythOS integration!');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

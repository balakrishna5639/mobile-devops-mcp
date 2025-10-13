#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

class MobileDevOpsMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: 'mobile-devops-mcp',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} },
    });
    
    this.setupTools();
  }

  private setupTools() {
    // Import Zod at the top of your file if not already imported
    // import { z } from 'zod';

    this.server.setRequestHandler(
      // Zod schema for the method
      z.object({ method: z.literal('tools/list') }),
      async () => ({
        tools: [
          {
            name: 'generate-cordova-config',
            description: 'Generate production-ready Cordova config.xml for Android/iOS deployment',
            inputSchema: {
              type: 'object',
              properties: {
                appName: { type: 'string', description: 'Application name' },
                packageId: { type: 'string', description: 'Package identifier (e.g., com.company.app)' },
                platforms: { 
                  type: 'array', 
                  items: { type: 'string', enum: ['android', 'ios'] },
                  description: 'Target platforms' 
                },
                minSdkVersion: { type: 'number', description: 'Minimum Android SDK version', default: 24 }
              },
              required: ['appName', 'packageId', 'platforms']
            }
          },
          {
            name: 'diagnose-android-build',
            description: 'Analyze Android build errors and provide practical solutions',
            inputSchema: {
              type: 'object',
              properties: {
                errorLog: { type: 'string', description: 'Complete build error log content' },
                gradleVersion: { type: 'string', description: 'Gradle version being used' },
                targetSdkVersion: { type: 'number', description: 'Target Android SDK version' }
              },
              required: ['errorLog']
            }
          },
          {
            name: 'setup-ios-signing',
            description: 'Configure iOS code signing with certificates and provisioning profiles',
            inputSchema: {
              type: 'object',
              properties: {
                certificateType: { 
                  type: 'string', 
                  enum: ['development', 'distribution', 'adhoc'],
                  description: 'Type of iOS certificate for signing'
                },
                bundleId: { type: 'string', description: 'iOS bundle identifier' },
                teamId: { type: 'string', description: 'Apple Developer Team ID' }
              },
              required: ['certificateType', 'bundleId']
            }
          }
        ]
      })
    );

    this.server.setRequestHandler(
      z.object({ method: z.literal('tools/call'), name: z.string(), arguments: z.any() }),
      async (request) => {
        const { name, arguments: args } = request;

        switch (name) {
          case 'generate-cordova-config':
            return this.generateCordovaConfig(args);
          case 'diagnose-android-build':
            return this.diagnoseAndroidBuild(args);
          case 'setup-ios-signing':
            return this.setupIOSSigning(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      }
    );
  }

  private async generateCordovaConfig(args: any) {
    const { appName, packageId, platforms, minSdkVersion = 24 } = args;
    
    const configXml = `<?xml version='1.0' encoding='utf-8'?>
<widget id="${packageId}" version="1.0.0" xmlns="http://www.w3.org/ns/widgets">
    <name>${appName}</name>
    <description>${appName} - Built with Mobile DevOps MCP Server</description>
    
    <author email="dev@company.com" href="https://company.com">Development Team</author>
    <content src="index.html" />
    
    <!-- Mobile DevOps Optimized Preferences -->
    <preference name="permissions" value="none" />
    <preference name="orientation" value="default" />
    <preference name="target-device" value="universal" />
    <preference name="fullscreen" value="true" />
    <preference name="webviewbounce" value="true" />
    
    <!-- Android Optimizations -->
    <preference name="android-minSdkVersion" value="${minSdkVersion}" />
    <preference name="android-targetSdkVersion" value="35" />
    <preference name="android-installLocation" value="auto" />
    
    ${platforms.includes('android') ? `
    <platform name="android">
        <preference name="AndroidWindowSplashScreenAnimatedIcon" value="res/screen/android/splash.png" />
        <preference name="AndroidWindowSplashScreenBackground" value="#ffffff" />
        
        <icon density="ldpi" src="res/icon/android/icon-36-ldpi.png" />
        <icon density="mdpi" src="res/icon/android/icon-48-mdpi.png" />
        <icon density="hdpi" src="res/icon/android/icon-72-hdpi.png" />
        <icon density="xhdpi" src="res/icon/android/icon-96-xhdpi.png" />
        <icon density="xxhdpi" src="res/icon/android/icon-144-xxhdpi.png" />
        
        <!-- Production-ready Android config -->
        <allow-intent href="market:*" />
    </platform>` : ''}
    
    ${platforms.includes('ios') ? `
    <platform name="ios">
        <preference name="deployment-target" value="11.0" />
        <preference name="target-device" value="universal" />
        
        <icon height="57" src="res/icon/ios/icon-57.png" width="57" />
        <icon height="114" src="res/icon/ios/icon-57-2x.png" width="114" />
        <icon height="72" src="res/icon/ios/icon-72.png" width="72" />
        <icon height="144" src="res/icon/ios/icon-72-2x.png" width="144" />
        
        <!-- Production-ready iOS config -->
        <allow-intent href="itms:*" />
        <allow-intent href="itms-apps:*" />
    </platform>` : ''}
    
    <access origin="*" />
</widget>`;

    return {
      content: [{
        type: 'text',
        text: `✅ Generated production-ready Cordova config.xml for ${appName}

📱 **Configuration Summary:**
• App Name: ${appName}
• Package ID: ${packageId}
• Platforms: ${platforms.join(', ')}
• Min Android SDK: ${minSdkVersion}
• Target Android SDK: 35
• iOS Deployment Target: 11.0+

🚀 **Optimizations Applied:**
• Platform-specific splash screens and icons
• Universal device support
• Production-ready intent filters
• Optimized Android SDK versions
• Cross-platform compatibility settings

**Generated config.xml:**

\`\`\`xml
${configXml}
\`\`\`

💡 **Next Steps:**
1. Save as config.xml in your Cordova project root
2. Add platform icons to res/icon/android/ and res/icon/ios/ 
3. Add splash screens to res/screen/android/
4. Run: cordova prepare && cordova build ${platforms.join(' ')}`
      }]
    };
  }

  private async diagnoseAndroidBuild(args: any) {
    const { errorLog, gradleVersion, targetSdkVersion } = args;
    
    let issues = [];
    let solutions = [];
    let commands = [];

    // Real Android build issue patterns from experience
    if (errorLog.includes('lStar not found') || errorLog.includes('resource android:attr')) {
      issues.push('🔴 Android resource compatibility issue (compileSdkVersion mismatch)');
      solutions.push('Update compileSdkVersion to 31+ in build.gradle');
      solutions.push('Add android:exported="true" to all activities, services, and receivers in AndroidManifest.xml');
    }

    if (errorLog.includes('Could not find method compile') || errorLog.includes('compile(')) {
      issues.push('🔴 Deprecated Gradle dependency syntax detected');
      solutions.push('Replace "compile" with "implementation" in all build.gradle files');
      solutions.push('Replace "testCompile" with "testImplementation"');
    }

    if (errorLog.includes('Build-Tools') && errorLog.includes('missing')) {
      issues.push('🔴 Missing Android SDK Build Tools');
      commands.push('cordova requirements android');
      solutions.push('Install missing Android SDK components via Android Studio or sdkmanager');
    }

    if (errorLog.includes('Failed to find target with hash string')) {
      issues.push('🔴 Android SDK platform not installed');
      commands.push('cordova requirements android');
      solutions.push('Install required Android SDK platform via Android Studio');
    }

    const diagnosis = `🔧 **Android Build Diagnosis Report**

${issues.length > 0 ? `**Issues Detected:**
${issues.map(issue => `• ${issue}`).join('\n')}` : '✅ No specific known issues detected in error log'}

${solutions.length > 0 ? `\n**Recommended Solutions:**
${solutions.map(sol => `• ${sol}`).join('\n')}` : ''}

**Standard Troubleshooting Steps:**
• Run: cordova clean
• Update platform: cordova platform rm android && cordova platform add android@latest  
• Check requirements: cordova requirements android
• Rebuild: cordova build android

${commands.length > 0 ? `\n**Required Commands:**
${commands.map(cmd => `• ${cmd}`).join('\n')}` : ''}

**Build Environment Check:**
• Gradle Version: ${gradleVersion || 'Not specified'}
• Target SDK Version: ${targetSdkVersion || 'Not specified (recommend 35)'}
• Min SDK Version: Ensure >= 24

💡 **Pro Tips:**
• Keep Android SDK and build tools updated
• Use consistent SDK versions across your project
• Check AndroidManifest.xml for missing android:exported attributes
• Consider using Android Studio for advanced debugging`;

    return {
      content: [{
        type: 'text',
        text: diagnosis
      }]
    };
  }

  private async setupIOSSigning(args: any) {
    const { certificateType, bundleId, teamId } = args;
    
    const buildJsonConfig = {
      ios: {
        [certificateType === 'distribution' ? 'release' : 'debug']: {
          codeSignIdentity: `iPhone ${certificateType === 'distribution' ? 'Distribution' : 'Developer'}`,
          developmentTeam: teamId || 'YOUR_TEAM_ID',
          packageType: certificateType === 'adhoc' ? 'ad-hoc' : 
                      certificateType === 'distribution' ? 'app-store' : 'development',
          provisioningProfile: 'AUTO'
        }
      }
    };

    const instructions = `🍎 **iOS Code Signing Setup Guide**

**Certificate Type:** ${certificateType}
**Bundle ID:** ${bundleId}
**Team ID:** ${teamId || 'YOUR_TEAM_ID'}

**Step-by-Step Instructions:**

1️⃣ **Xcode Configuration**
   • Open Xcode → Preferences → Accounts
   • Add your Apple ID if not already added
   • Select team: ${teamId || 'YOUR_TEAM_ID'}
   • Download ${certificateType} certificates

2️⃣ **Apple Developer Portal**
   • Go to https://developer.apple.com/account/
   • Navigate to Certificates, Identifiers & Profiles
   • Create ${certificateType} provisioning profile for ${bundleId}
   • Download and install the provisioning profile

3️⃣ **Project Configuration**
   • Create build.json in your project root:

\`\`\`json
${JSON.stringify(buildJsonConfig, null, 2)}
\`\`\`

4️⃣ **Build Commands**
   • Development: \`cordova build ios --debug --device\`
   • ${certificateType === 'distribution' ? 'Distribution: `cordova build ios --release --device`' : 
      certificateType === 'adhoc' ? 'Ad Hoc: `cordova build ios --release --device`' : 
      'Debug: `cordova build ios --debug --device`'}

5️⃣ **Verification**
   • Check signing in Xcode project settings
   • Verify provisioning profile is correctly assigned
   • Test build on physical device

💡 **Troubleshooting:**
• If automatic signing fails, manually specify provisioning profile UUID
• Ensure bundle ID matches exactly in Apple Developer Portal
• Check certificate expiration dates
• Use Xcode's "Manage Certificates" for certificate issues

🚀 **Ready for App Store submission!**`;

    return {
      content: [{
        type: 'text',
        text: instructions
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Mobile DevOps MCP Server running on stdio');
  }
}

const server = new MobileDevOpsMCPServer();
server.run().catch(console.error);

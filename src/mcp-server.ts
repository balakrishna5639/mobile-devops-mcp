#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  generateCordovaConfig,
  CordovaConfigInputSchema,
  diagnoseAndroidBuild,
  AndroidDiagnosticInputSchema,
  setupIOSSigning,
  IOSSigningInputSchema,
} from './tools/index.js';

// ─── Tool Metadata ─────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'generate-cordova-config',
    description:
      'Generate production-ready Cordova config.xml for Android/iOS deployment',
    inputSchema: {
      type: 'object' as const,
      properties: {
        appName: { type: 'string', description: 'Application name' },
        packageId: {
          type: 'string',
          description: 'Package identifier (e.g., com.company.app)',
        },
        platforms: {
          type: 'array',
          items: { type: 'string', enum: ['android', 'ios'] },
          description: 'Target platforms',
        },
        minSdkVersion: {
          type: 'number',
          description: 'Minimum Android SDK version (default: 24)',
        },
      },
      required: ['appName', 'packageId', 'platforms'],
    },
  },
  {
    name: 'diagnose-android-build',
    description:
      'Analyze Android build errors and provide practical solutions (14 known patterns)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        errorLog: {
          type: 'string',
          description: 'Complete build error log content',
        },
        gradleVersion: {
          type: 'string',
          description: 'Gradle version being used',
        },
        targetSdkVersion: {
          type: 'number',
          description: 'Target Android SDK version',
        },
      },
      required: ['errorLog'],
    },
  },
  {
    name: 'setup-ios-signing',
    description:
      'Configure iOS code signing with certificates and provisioning profiles',
    inputSchema: {
      type: 'object' as const,
      properties: {
        certificateType: {
          type: 'string',
          enum: ['development', 'distribution', 'adhoc'],
          description: 'Type of iOS certificate for signing',
        },
        bundleId: {
          type: 'string',
          description: 'iOS bundle identifier',
        },
        teamId: {
          type: 'string',
          description: 'Apple Developer Team ID',
        },
      },
      required: ['certificateType', 'bundleId'],
    },
  },
] as const;

// ─── Tool Execution Router ─────────────────────────────────────────

function executeTool(name: string, args: Record<string, unknown>): { content: { type: string; text: string }[] } {
  switch (name) {
    case 'generate-cordova-config': {
      const input = CordovaConfigInputSchema.parse(args);
      const result = generateCordovaConfig(input);
      return {
        content: [
          {
            type: 'text',
            text: `✅ ${result.message}\n\n` +
              `📱 **Configuration Summary:**\n` +
              `• App Name: ${input.appName}\n` +
              `• Package ID: ${input.packageId}\n` +
              `• Platforms: ${input.platforms.join(', ')}\n\n` +
              `🚀 **Features:**\n` +
              result.features.map((f) => `• ${f}`).join('\n') +
              `\n\n\`\`\`xml\n${result.config}\n\`\`\`\n\n` +
              `💡 **Next Steps:**\n` +
              `1. Save as config.xml in your Cordova project root\n` +
              `2. Add platform icons and splash screens\n` +
              `3. Run: cordova prepare && cordova build ${input.platforms.join(' ')}`,
          },
        ],
      };
    }

    case 'diagnose-android-build': {
      const input = AndroidDiagnosticInputSchema.parse(args);
      const result = diagnoseAndroidBuild(input);
      const issueLines = result.issues
        .map((i) => `• ${i.severity === 'critical' ? '🔴' : i.severity === 'warning' ? '🟡' : 'ℹ️'} **${i.issue}**\n  → ${i.solution}${i.command ? `\n  \`${i.command}\`` : ''}`)
        .join('\n\n');
      return {
        content: [
          {
            type: 'text',
            text: `🔧 **Android Build Diagnosis Report**\n\n` +
              `${issueLines}\n\n` +
              `**Standard Troubleshooting Steps:**\n` +
              result.recommendedSteps.map((s) => `• ${s}`).join('\n') +
              `\n\n**Environment:**\n` +
              `• Gradle: ${result.environment.gradleVersion}\n` +
              `• Target SDK: ${result.environment.targetSdkVersion}`,
          },
        ],
      };
    }

    case 'setup-ios-signing': {
      const input = IOSSigningInputSchema.parse(args);
      const result = setupIOSSigning(input);
      return {
        content: [
          {
            type: 'text',
            text: `🍎 **iOS Code Signing Setup**\n\n` +
              `**Certificate:** ${result.certificateType}\n` +
              `**Bundle ID:** ${result.bundleId}\n` +
              `**Team ID:** ${result.teamId}\n\n` +
              `**build.json:**\n\`\`\`json\n${JSON.stringify(result.buildConfig, null, 2)}\n\`\`\`\n\n` +
              `**Instructions:**\n` +
              result.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n'),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP Server ────────────────────────────────────────────────────

class MobileDevOpsMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'mobile-devops-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    this.registerHandlers();
  }

  private registerHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [...TOOLS],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        return executeTool(name, (args ?? {}) as Record<string, unknown>);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `❌ Error: ${message}` }],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Mobile DevOps MCP Server running on stdio');
  }
}

const server = new MobileDevOpsMCPServer();
server.run().catch(console.error);

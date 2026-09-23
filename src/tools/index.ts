/**
 * Mobile DevOps Tools
 *
 * Shared tool implementations consumed by both the SmythOS agent entry point
 * and the standalone MCP server. This barrel export provides a single import
 * surface for all tool functions and their Zod schemas.
 */

export { escapeXml } from './xml-utils.js';

export {
  generateCordovaConfig,
  CordovaConfigInputSchema,
  type CordovaConfigInput,
  type CordovaConfigResult,
} from './cordova-config.js';

export {
  diagnoseAndroidBuild,
  AndroidDiagnosticInputSchema,
  type AndroidDiagnosticInput,
  type AndroidDiagnosticResult,
  type DiagnosticIssue,
} from './android-diagnostic.js';

export {
  setupIOSSigning,
  IOSSigningInputSchema,
  type IOSSigningInput,
  type IOSSigningResult,
} from './ios-signing.js';

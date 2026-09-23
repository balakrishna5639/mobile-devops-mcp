import { z } from 'zod';

// ─── Input / Output Types ────────────────────────────────────────────

export const AndroidDiagnosticInputSchema = z.object({
  errorLog: z.string().min(1, 'errorLog is required'),
  gradleVersion: z.string().optional(),
  targetSdkVersion: z.number().int().optional(),
});

export type AndroidDiagnosticInput = z.infer<typeof AndroidDiagnosticInputSchema>;

export interface DiagnosticIssue {
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  solution: string;
  command?: string;
}

export interface AndroidDiagnosticResult {
  issues: DiagnosticIssue[];
  recommendedSteps: string[];
  environment: {
    gradleVersion: string;
    targetSdkVersion: string;
  };
}

// ─── Error Pattern Definitions ───────────────────────────────────────

interface ErrorPattern {
  test: (log: string) => boolean;
  issue: DiagnosticIssue;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    test: (log) => /lStar not found|resource android:attr/.test(log),
    issue: {
      severity: 'critical',
      issue: 'Android resource compatibility issue (compileSdkVersion mismatch)',
      solution:
        'Update compileSdkVersion to 31+ in build.gradle and add android:exported="true" to all <activity>, <service>, and <receiver> in AndroidManifest.xml',
    },
  },
  {
    test: (log) => /Could not find method compile\b|compile\(/.test(log),
    issue: {
      severity: 'critical',
      issue: 'Deprecated Gradle dependency syntax',
      solution:
        'Replace "compile" with "implementation" and "testCompile" with "testImplementation" in all build.gradle files',
    },
  },
  {
    test: (log) => /Build-Tools.*missing|missing.*Build-Tools/.test(log),
    issue: {
      severity: 'critical',
      issue: 'Missing Android SDK Build Tools',
      solution: 'Install missing SDK components via Android Studio → SDK Manager, or run sdkmanager from CLI',
      command: 'cordova requirements android',
    },
  },
  {
    test: (log) => /Failed to find target with hash string/.test(log),
    issue: {
      severity: 'critical',
      issue: 'Android SDK platform not installed',
      solution: 'Install the required Android SDK platform via Android Studio → SDK Manager',
      command: 'cordova requirements android',
    },
  },
  {
    test: (log) => /INSTALL_FAILED_UPDATE_INCOMPATIBLE/.test(log),
    issue: {
      severity: 'critical',
      issue: 'App signing key mismatch — cannot update existing installation',
      solution: 'Uninstall the existing app from the device/emulator first, then reinstall',
      command: 'adb uninstall <your.package.id> && cordova run android',
    },
  },
  {
    test: (log) => /Minimum supported Gradle version/.test(log),
    issue: {
      severity: 'critical',
      issue: 'Gradle version is too old for the project requirements',
      solution:
        'Update gradle-wrapper.properties distributionUrl to the required version, or update via Android Studio',
    },
  },
  {
    test: (log) => /Execution failed for task.*processDebugResources|AAPT2/.test(log),
    issue: {
      severity: 'critical',
      issue: 'AAPT2 resource processing failure',
      solution:
        'Check for invalid resource names (must be lowercase a-z, 0-9, underscore), missing drawables, or conflicting resource definitions',
      command: 'cordova clean && cordova build android',
    },
  },
  {
    test: (log) => /duplicate entry|Duplicate class/.test(log),
    issue: {
      severity: 'critical',
      issue: 'Duplicate classes detected in classpath',
      solution:
        'Check for conflicting plugin dependencies. Use "gradle dependencies" to find duplicates and exclude them in build.gradle',
      command: 'cd platforms/android && ./gradlew app:dependencies',
    },
  },
  {
    test: (log) => /Cannot fit requested classes in a single dex file|multidex/.test(log),
    issue: {
      severity: 'warning',
      issue: 'Method count exceeds 64K limit — multidex required',
      solution:
        'Enable multidex: add multiDexEnabled=true in defaultConfig and "implementation androidx.multidex:multidex:2.0.1" to dependencies',
    },
  },
  {
    test: (log) => /CLEARTEXT communication|ERR_CLEARTEXT_NOT_PERMITTED/.test(log),
    issue: {
      severity: 'warning',
      issue: 'Android 9+ blocks cleartext (HTTP) traffic by default',
      solution:
        'Add android:usesCleartextTraffic="true" to <application> in AndroidManifest.xml, or migrate to HTTPS',
    },
  },
  {
    test: (log) => /uses-sdk:minSdkVersion.*cannot be smaller|minSdkVersion.*is not compatible/.test(log),
    issue: {
      severity: 'warning',
      issue: 'Plugin requires a higher minSdkVersion than the project',
      solution:
        'Increase android-minSdkVersion in config.xml to match the plugin requirement, or find a compatible plugin version',
    },
  },
  {
    test: (log) => /Manifest merger failed/.test(log),
    issue: {
      severity: 'critical',
      issue: 'AndroidManifest.xml merge conflict between plugins',
      solution:
        'Add tools:replace="android:value" or tools:node="merge" attributes to resolve conflicts. Check plugin AndroidManifest.xml files for duplicate definitions',
    },
  },
  {
    test: (log) => /ANDROID_HOME.*not set|ANDROID_SDK_ROOT/.test(log),
    issue: {
      severity: 'critical',
      issue: 'ANDROID_HOME / ANDROID_SDK_ROOT environment variable not configured',
      solution:
        'Set ANDROID_HOME to your Android SDK path (e.g., ~/Android/Sdk or C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk)',
    },
  },
  {
    test: (log) => /Kotlin.*version.*incompatible|kotlin-stdlib/.test(log),
    issue: {
      severity: 'warning',
      issue: 'Kotlin version mismatch between plugins or project configuration',
      solution:
        'Align Kotlin version across all plugins by setting ext.kotlin_version in the root build.gradle',
    },
  },
];

// ─── Core Logic ──────────────────────────────────────────────────────

export function diagnoseAndroidBuild(raw: AndroidDiagnosticInput): AndroidDiagnosticResult {
  const input = AndroidDiagnosticInputSchema.parse(raw);

  const matchedIssues = ERROR_PATTERNS
    .filter((pattern) => pattern.test(input.errorLog))
    .map((pattern) => pattern.issue);

  if (matchedIssues.length === 0) {
    matchedIssues.push({
      severity: 'info',
      issue: 'No specific known issues detected in the error log',
      solution: 'Try the standard troubleshooting steps below',
    });
  }

  return {
    issues: matchedIssues,
    recommendedSteps: [
      'Run "cordova requirements android" to check environment',
      'Clean and rebuild: "cordova clean && cordova build android"',
      'Update platform: "cordova platform rm android && cordova platform add android@latest"',
      'Check AndroidManifest.xml for missing android:exported attributes',
      'Verify ANDROID_HOME and JAVA_HOME environment variables',
      'Ensure Android Studio and SDK tools are up to date',
    ],
    environment: {
      gradleVersion: input.gradleVersion ?? 'Not specified',
      targetSdkVersion: input.targetSdkVersion
        ? String(input.targetSdkVersion)
        : 'Not specified (recommend 35)',
    },
  };
}

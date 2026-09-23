import { describe, it, expect } from 'vitest';
import { diagnoseAndroidBuild, AndroidDiagnosticInputSchema } from '../android-diagnostic.js';

describe('AndroidDiagnosticInputSchema', () => {
  it('validates a correct input', () => {
    const result = AndroidDiagnosticInputSchema.safeParse({ errorLog: 'some error' });
    expect(result.success).toBe(true);
  });

  it('rejects empty errorLog', () => {
    const result = AndroidDiagnosticInputSchema.safeParse({ errorLog: '' });
    expect(result.success).toBe(false);
  });
});

describe('diagnoseAndroidBuild', () => {
  it('detects lStar resource compatibility issue', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'AAPT: resource android:attr/lStar not found' });
    expect(result.issues[0].issue).toContain('resource compatibility');
    expect(result.issues[0].severity).toBe('critical');
  });

  it('detects deprecated compile syntax', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Could not find method compile() for arguments' });
    expect(result.issues[0].issue).toContain('Deprecated Gradle');
  });

  it('detects missing Build-Tools', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Android SDK Build-Tools missing component' });
    expect(result.issues[0].issue).toContain('Missing Android SDK Build Tools');
    expect(result.issues[0].command).toBeDefined();
  });

  it('detects SDK platform not installed', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Failed to find target with hash string android-35' });
    expect(result.issues[0].issue).toContain('SDK platform not installed');
  });

  it('detects INSTALL_FAILED_UPDATE_INCOMPATIBLE', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'INSTALL_FAILED_UPDATE_INCOMPATIBLE' });
    expect(result.issues[0].issue).toContain('signing key mismatch');
  });

  it('detects Gradle version too old', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Minimum supported Gradle version is 8.0' });
    expect(result.issues[0].issue).toContain('Gradle version');
  });

  it('detects AAPT2 resource failure', () => {
    const result = diagnoseAndroidBuild({ errorLog: "Execution failed for task ':app:processDebugResources'" });
    expect(result.issues[0].issue).toContain('AAPT2');
  });

  it('detects duplicate class entries', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Duplicate class com.google.gson.Gson found' });
    expect(result.issues[0].issue).toContain('Duplicate classes');
  });

  it('detects multidex requirement', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Cannot fit requested classes in a single dex file' });
    expect(result.issues[0].issue).toContain('multidex');
    expect(result.issues[0].severity).toBe('warning');
  });

  it('detects cleartext traffic block', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'ERR_CLEARTEXT_NOT_PERMITTED' });
    expect(result.issues[0].issue).toContain('cleartext');
  });

  it('detects minSdkVersion mismatch', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'uses-sdk:minSdkVersion 16 cannot be smaller than version 21' });
    expect(result.issues[0].issue).toContain('higher minSdkVersion');
  });

  it('detects manifest merger failure', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Manifest merger failed with multiple errors' });
    expect(result.issues[0].issue).toContain('Manifest');
  });

  it('detects ANDROID_HOME not set', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'ANDROID_HOME is not set' });
    expect(result.issues[0].issue).toContain('ANDROID_HOME');
  });

  it('detects Kotlin version mismatch', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Kotlin version is incompatible with the project' });
    expect(result.issues[0].issue).toContain('Kotlin version');
  });

  it('detects multiple issues in one log', () => {
    const result = diagnoseAndroidBuild({
      errorLog: 'resource android:attr/lStar not found. Could not find method compile()',
    });
    expect(result.issues.length).toBe(2);
  });

  it('returns info-level fallback when no patterns match', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'Some unknown error occurred' });
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('info');
  });

  it('includes environment info', () => {
    const result = diagnoseAndroidBuild({
      errorLog: 'error',
      gradleVersion: '8.2',
      targetSdkVersion: 35,
    });
    expect(result.environment.gradleVersion).toBe('8.2');
    expect(result.environment.targetSdkVersion).toBe('35');
  });

  it('defaults environment fields when not provided', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'error' });
    expect(result.environment.gradleVersion).toBe('Not specified');
    expect(result.environment.targetSdkVersion).toContain('Not specified');
  });

  it('always includes recommendedSteps', () => {
    const result = diagnoseAndroidBuild({ errorLog: 'error' });
    expect(result.recommendedSteps.length).toBeGreaterThan(0);
  });
});

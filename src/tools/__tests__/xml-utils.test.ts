import { describe, it, expect } from 'vitest';
import { escapeXml } from '../xml-utils.js';

describe('escapeXml', () => {
  it('escapes ampersand', () => {
    expect(escapeXml('A & B')).toBe('A &amp; B');
  });

  it('escapes angle brackets', () => {
    expect(escapeXml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('escapes double quotes', () => {
    expect(escapeXml('value="test"')).toBe('value=&quot;test&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeXml("it's")).toBe('it&apos;s');
  });

  it('escapes all special characters together', () => {
    expect(escapeXml('<tag attr="a&b\'c">')).toBe(
      '&lt;tag attr=&quot;a&amp;b&apos;c&quot;&gt;',
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeXml('')).toBe('');
  });

  it('returns empty string for undefined/null-like input', () => {
    expect(escapeXml(undefined as unknown as string)).toBe('');
    expect(escapeXml(null as unknown as string)).toBe('');
  });

  it('passes through safe strings unchanged', () => {
    expect(escapeXml('Hello World 123')).toBe('Hello World 123');
  });
});

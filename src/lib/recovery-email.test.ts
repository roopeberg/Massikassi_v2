import { beforeAll, describe, expect, it } from "vitest";
import { emailKeyFor, generateToken, hashToken, normalizeEmail } from "./recovery-email";

beforeAll(() => {
  process.env.EMAIL_HMAC_SECRET = "test-secret-do-not-use-in-prod";
});

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
  });
});

describe("emailKeyFor", () => {
  it("is deterministic for the same address", () => {
    expect(emailKeyFor("test@example.com")).toBe(emailKeyFor("test@example.com"));
  });

  it("normalizes before keying, so casing/whitespace don't change the result", () => {
    expect(emailKeyFor("  Test@Example.COM  ")).toBe(emailKeyFor("test@example.com"));
  });

  it("differs for different addresses", () => {
    expect(emailKeyFor("a@example.com")).not.toBe(emailKeyFor("b@example.com"));
  });

  it("is a 64-character hex string (SHA-256 output)", () => {
    expect(emailKeyFor("test@example.com")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("depends on the secret — a different secret produces a different key", () => {
    const withFirstSecret = emailKeyFor("test@example.com");
    process.env.EMAIL_HMAC_SECRET = "a-different-secret";
    const withSecondSecret = emailKeyFor("test@example.com");
    process.env.EMAIL_HMAC_SECRET = "test-secret-do-not-use-in-prod";
    expect(withFirstSecret).not.toBe(withSecondSecret);
  });

  it("throws if the secret isn't configured", () => {
    delete process.env.EMAIL_HMAC_SECRET;
    expect(() => emailKeyFor("test@example.com")).toThrow();
    process.env.EMAIL_HMAC_SECRET = "test-secret-do-not-use-in-prod";
  });
});

describe("generateToken / hashToken", () => {
  it("generates distinct tokens each time", () => {
    expect(generateToken()).not.toBe(generateToken());
  });

  it("hashToken is deterministic", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("hashToken differs for different tokens", () => {
    expect(hashToken(generateToken())).not.toBe(hashToken(generateToken()));
  });

  it("hashToken output is a 64-character hex string", () => {
    expect(hashToken(generateToken())).toMatch(/^[0-9a-f]{64}$/);
  });
});

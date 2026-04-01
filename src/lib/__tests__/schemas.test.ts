import { describe, expect, it } from "vitest";
import {
  familyProfileSchema,
  localSignupSchema,
  onboardingRoleSchema,
  professionalProfileSchema,
} from "../schemas";

describe("localSignupSchema", () => {
  it("accepts valid signup data", () => {
    const result = localSignupSchema.safeParse({
      name: "Maria Silva",
      email: "maria@example.com",
      password: "Senha123",
      confirmPassword: "Senha123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short names", () => {
    const result = localSignupSchema.safeParse({
      name: "A",
      email: "a@example.com",
      password: "Senha123",
      confirmPassword: "Senha123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without numbers", () => {
    const result = localSignupSchema.safeParse({
      name: "Maria Silva",
      email: "maria@example.com",
      password: "SenhaSemNumero",
      confirmPassword: "SenhaSemNumero",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = localSignupSchema.safeParse({
      name: "Maria Silva",
      email: "maria@example.com",
      password: "Senha123",
      confirmPassword: "Senha456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects invalid email", () => {
    const result = localSignupSchema.safeParse({
      name: "Maria Silva",
      email: "not-an-email",
      password: "Senha123",
      confirmPassword: "Senha123",
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingRoleSchema", () => {
  it("accepts FAMILY with both agreements", () => {
    const result = onboardingRoleSchema.safeParse({
      role: "FAMILY",
      acceptTerms: true,
      acceptPrivacy: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts PROFESSIONAL with both agreements", () => {
    const result = onboardingRoleSchema.safeParse({
      role: "PROFESSIONAL",
      acceptTerms: true,
      acceptPrivacy: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects ADMIN role", () => {
    const result = onboardingRoleSchema.safeParse({
      role: "ADMIN",
      acceptTerms: true,
      acceptPrivacy: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing agreement", () => {
    const result = onboardingRoleSchema.safeParse({
      role: "FAMILY",
      acceptTerms: true,
      // missing acceptPrivacy
    });
    expect(result.success).toBe(false);
  });
});

describe("familyProfileSchema", () => {
  it("accepts valid profile", () => {
    const result = familyProfileSchema.safeParse({
      contactName: "Ana Lima",
      state: "SP",
      city: "São Paulo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = familyProfileSchema.safeParse({
      contactName: "Ana",
      // missing state and city
    });
    expect(result.success).toBe(false);
  });
});

describe("professionalProfileSchema", () => {
  it("accepts valid profile", () => {
    const result = professionalProfileSchema.safeParse({
      serviceTypes: ["BABYSITTER"],
      state: "RJ",
      city: "Rio de Janeiro",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when hourlyRateMin > hourlyRateMax", () => {
    const result = professionalProfileSchema.safeParse({
      serviceTypes: ["BABYSITTER"],
      state: "RJ",
      city: "Rio de Janeiro",
      hourlyRateMin: 100,
      hourlyRateMax: 50,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("hourlyRateMin");
    }
  });

  it("rejects empty serviceTypes", () => {
    const result = professionalProfileSchema.safeParse({
      serviceTypes: [],
      state: "RJ",
      city: "Rio de Janeiro",
    });
    expect(result.success).toBe(false);
  });
});

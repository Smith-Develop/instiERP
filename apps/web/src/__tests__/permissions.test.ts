import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSIONS, hasAnyPermission, ROLE_PERMISSIONS } from "@insti/auth";

describe("hasAnyPermission", () => {
  it("returns true if role has at least one permission", () => {
    expect(hasAnyPermission("DIRECTOR", [PERMISSIONS.STUDENTS_READ, PERMISSIONS.FINANCE_WRITE])).toBe(true);
    expect(hasAnyPermission("DIRECTOR", [PERMISSIONS.FINANCE_WRITE, PERMISSIONS.PAYMENTS_WRITE])).toBe(false);
  });

  it("SUPER_ADMIN succeeds for any permission", () => {
    expect(hasAnyPermission("SUPER_ADMIN", ["nonexistent"])).toBe(true);
  });
});

describe("ROLE_PERMISSIONS coverage", () => {
  it("every role is defined", () => {
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toBeDefined();
    expect(ROLE_PERMISSIONS.DIRECTOR).toBeDefined();
    expect(ROLE_PERMISSIONS.SECRETARIA).toBeDefined();
    expect(ROLE_PERMISSIONS.PROFESOR).toBeDefined();
    expect(ROLE_PERMISSIONS.PADRE).toBeDefined();
    expect(ROLE_PERMISSIONS.ESTUDIANTE).toBeDefined();
    expect(ROLE_PERMISSIONS.CONTABILIDAD).toBeDefined();
  });

  it("DIRECTOR has at least 10 permissions", () => {
    expect(ROLE_PERMISSIONS.DIRECTOR.length).toBeGreaterThanOrEqual(10);
  });

  it("ESTUDIANTE has no write permissions for students", () => {
    expect(hasPermission("ESTUDIANTE", PERMISSIONS.STUDENTS_WRITE)).toBe(false);
  });

  it("CONTABILIDAD has finance access", () => {
    expect(hasPermission("CONTABILIDAD", PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(hasPermission("CONTABILIDAD", PERMISSIONS.FINANCE_WRITE)).toBe(true);
    expect(hasPermission("CONTABILIDAD", PERMISSIONS.GRADES_READ)).toBe(false);
  });

  it("PADRE can write payments", () => {
    expect(hasPermission("PADRE", PERMISSIONS.PAYMENTS_WRITE)).toBe(true);
    expect(hasPermission("PADRE", PERMISSIONS.PAYMENTS_READ)).toBe(false);
  });

  it("SECRETARIA can manage admissions", () => {
    expect(hasPermission("SECRETARIA", PERMISSIONS.ADMISSIONS_READ)).toBe(true);
    expect(hasPermission("SECRETARIA", PERMISSIONS.ADMISSIONS_WRITE)).toBe(true);
  });

  it("PROFESOR can access classroom and submissions", () => {
    expect(hasPermission("PROFESOR", PERMISSIONS.ASSIGNMENTS_READ)).toBe(true);
    expect(hasPermission("PROFESOR", PERMISSIONS.ASSIGNMENTS_WRITE)).toBe(true);
    expect(hasPermission("PROFESOR", PERMISSIONS.SUBMISSIONS_READ)).toBe(true);
    expect(hasPermission("PROFESOR", PERMISSIONS.SUBMISSIONS_WRITE)).toBe(true);
  });
});

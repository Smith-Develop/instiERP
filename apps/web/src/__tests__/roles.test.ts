import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSIONS } from "@insti/auth";

describe("hasPermission", () => {
  it("SUPER_ADMIN has all permissions", () => {
    expect(hasPermission("SUPER_ADMIN", "students:read")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "finance:write")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "nonexistent:perm")).toBe(true);
  });

  it("DIRECTOR has expected permissions", () => {
    expect(hasPermission("DIRECTOR", PERMISSIONS.STUDENTS_READ)).toBe(true);
    expect(hasPermission("DIRECTOR", PERMISSIONS.STUDENTS_WRITE)).toBe(true);
    expect(hasPermission("DIRECTOR", PERMISSIONS.ATTENDANCE_READ)).toBe(true);
    expect(hasPermission("DIRECTOR", PERMISSIONS.FINANCE_READ)).toBe(true);
    expect(hasPermission("DIRECTOR", PERMISSIONS.FINANCE_WRITE)).toBe(false);
    expect(hasPermission("DIRECTOR", PERMISSIONS.PAYMENTS_WRITE)).toBe(false);
  });

  it("PROFESOR has limited permissions", () => {
    expect(hasPermission("PROFESOR", PERMISSIONS.STUDENTS_READ)).toBe(true);
    expect(hasPermission("PROFESOR", PERMISSIONS.STUDENTS_WRITE)).toBe(false);
    expect(hasPermission("PROFESOR", PERMISSIONS.ATTENDANCE_READ)).toBe(true);
    expect(hasPermission("PROFESOR", PERMISSIONS.ATTENDANCE_WRITE)).toBe(true);
    expect(hasPermission("PROFESOR", PERMISSIONS.GRADES_WRITE)).toBe(true);
    expect(hasPermission("PROFESOR", PERMISSIONS.FINANCE_READ)).toBe(false);
  });

  it("PADRE can read but not write students", () => {
    expect(hasPermission("PADRE", PERMISSIONS.STUDENTS_READ)).toBe(true);
    expect(hasPermission("PADRE", PERMISSIONS.STUDENTS_WRITE)).toBe(false);
    expect(hasPermission("PADRE", PERMISSIONS.PAYMENTS_WRITE)).toBe(true);
  });

  it("ESTUDIANTE has minimal permissions", () => {
    expect(hasPermission("ESTUDIANTE", PERMISSIONS.GRADES_READ)).toBe(true);
    expect(hasPermission("ESTUDIANTE", PERMISSIONS.GRADES_WRITE)).toBe(false);
    expect(hasPermission("ESTUDIANTE", PERMISSIONS.ATTENDANCE_READ)).toBe(true);
    expect(hasPermission("ESTUDIANTE", PERMISSIONS.COMMUNICATION_WRITE)).toBe(false);
    expect(hasPermission("ESTUDIANTE", PERMISSIONS.STUDENTS_READ)).toBe(false);
  });

  it("unknown role returns false", () => {
    expect(hasPermission("INVALID_ROLE" as never, "students:read")).toBe(false);
  });
});

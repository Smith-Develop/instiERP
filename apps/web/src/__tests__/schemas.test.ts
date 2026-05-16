import { describe, it, expect } from "vitest";
import { studentSchema } from "@/modules/students/schemas";

describe("studentSchema", () => {
  it("accepts valid minimal input", () => {
    const result = studentSchema.safeParse({
      first_name: "Ana",
      last_name: "García",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty first_name", () => {
    const result = studentSchema.safeParse({
      first_name: "",
      last_name: "García",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing last_name", () => {
    const result = studentSchema.safeParse({
      first_name: "Ana",
    });
    expect(result.success).toBe(false);
  });

  it("accepts full input with all optional fields", () => {
    const result = studentSchema.safeParse({
      first_name: "Luis",
      last_name: "Martínez",
      document_type: "DNI",
      document_number: "12345678A",
      birth_date: "2015-03-15",
      gender: "M",
      address: "Calle Mayor 1",
      medical_notes: "Alergia al polen",
      emergency_contact: "María Martínez",
      emergency_phone: "+34 600 000 000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.first_name).toBe("Luis");
      expect(result.data.gender).toBe("M");
    }
  });

  it("accepts empty optional fields", () => {
    const result = studentSchema.safeParse({
      first_name: "Ana",
      last_name: "García",
      document_type: undefined,
    });
    expect(result.success).toBe(true);
  });
});

import { z } from "zod";

export const guardianSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  is_primary: z.boolean().default(false),
});

export type GuardianInput = z.infer<typeof guardianSchema>;

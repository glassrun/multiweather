import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const signupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.email(),
  password: z.string().min(8).max(200),
});

export class EmailAlreadyRegisteredError extends Error {}

export async function createUser(input: z.infer<typeof signupSchema>) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new EmailAlreadyRegisteredError("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
    select: { id: true, email: true, name: true },
  });
}

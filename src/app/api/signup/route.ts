import { NextRequest, NextResponse } from "next/server";
import { createUser, signupSchema, EmailAlreadyRegisteredError } from "@/lib/users";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup data" }, { status: 400 });
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof EmailAlreadyRegisteredError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

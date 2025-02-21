import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";

export async function POST(req: Request) {
  const { password, email, name, image } = await req.json();
  try {
    const userExistsQuery = await sql`
      SELECT COUNT(*) > 0 AS exists
      FROM users
      WHERE email = ${email}
    `;

    if (userExistsQuery.rows[0].exists) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (email, password, name, image, provider)
      VALUES (${email}, ${hashedPassword}, ${name}, ${image}, 'credentials')
      RETURNING id, email, name, image
    `;

    if (!result.rows[0]) {
      throw new Error("Failed to create user");
    }

    return NextResponse.json({ 
      message: "User registered successfully",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

import fs from "fs";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const attendees = await sql`
      SELECT 
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        phone
      FROM attendees
    `;
    return NextResponse.json(attendees.rows);
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendees" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const attendee = await req.json();

    const newAttendee = await sql`
      INSERT INTO attendees (first_name, last_name, email, phone)
      VALUES (${attendee.firstName}, ${attendee.lastName}, ${attendee.email}, ${attendee.phone})
      RETURNING id, first_name, last_name, email, phone
    `;

    const savedAttendee = newAttendee.rows[0];

    return NextResponse.json(savedAttendee, { status: 201 });
  } catch (error) {
    console.error("Error adding attendee:", error);
    return NextResponse.json(
      { error: "Failed to add attendee" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

type Params = {
  id: string;
};

export async function GET(_: Request, { params }: { params: Params }) {
  const { id } = params;

  try {
    const attendeeId = await sql`
      SELECT 
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        phone
      FROM attendees
      WHERE id = ${parseInt(id, 10)}
    `;

    if (attendeeId.rows.length > 0) {
      return NextResponse.json(attendeeId.rows[0]);
    } else {
      return NextResponse.json({ message: "Attendee not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching attendee:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendee" },
      { status: 500 }
    );
  }
}

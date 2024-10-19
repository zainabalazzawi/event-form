import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getServerSession } from "next-auth/next";

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
      return NextResponse.json(
        { message: "Attendee not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching attendee:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendee" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = params;
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { attendanceState } = await req.json();
    const attendee = await sql`
      SELECT email FROM attendees WHERE id = ${parseInt(id, 10)}
    `;

    if (attendee.rows[0].email !== session.user?.email) {
      return NextResponse.json(
        { error: "only the attendee can update their own attendance state" },
        { status: 403 }
      );
    }

    const updatedAttendee = await sql`
      UPDATE attendees
      SET attendance_state = ${attendanceState}
      WHERE id = ${parseInt(id, 10)}
      RETURNING id, first_name AS "firstName", last_name AS "lastName", email, phone, attendance_state AS "attendanceState"
    `;

    return NextResponse.json(updatedAttendee.rows[0]);
  } catch (error) {
    console.error("Error updating attendee:", error);
    return NextResponse.json(
      { error: "Failed to update attendee" },
      { status: 500 }
    );
  }
}

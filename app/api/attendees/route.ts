import fs from "fs";
import data from "../../../lib/data.json";
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const newAttendee = await req.json();

    newAttendee.id = Math.floor(Math.random() * 100);
    data.push(newAttendee);

    fs.writeFileSync("lib/data.json", JSON.stringify(data, null, 2));
    return NextResponse.json(newAttendee, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add attendee" },
      { status: 500 }
    );
  }
}


 import data from "../../../../lib/data.json";
import { NextResponse } from "next/server";



type Params = {
    id: string;
  };
  
export async function GET(_: Request,{ params }: { params:Params }) {
  const { id } = params;
  const attendee = data.find((attendee) => attendee.id === parseInt(id, 10));

  if (attendee) {
    return NextResponse.json(attendee);
  } else {
    return NextResponse.json({ message: "Attendee not found" }, { status: 404 });
  }
}

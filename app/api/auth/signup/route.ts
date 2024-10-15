import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";



// let users = []; // add type 
export async function POST(req: Request) {
  try {
    // const { username, password, email } = await req.json();

    // const existingUser = users.find((user) => user.email === email);
    // if (existingUser) {
    //   return NextResponse.json(
    //     { error: "user already exists" },
    //     { status: 409 }
    //   );
    // }

    // const hashedPassword = await bcrypt.hash(password, 10);

    // const newUser = {
    //   username,
    //   email,
    //   password:hashedPassword,
    // };
    // users.push(newUser);
// use fs.writeFile to store 
    return NextResponse.json({ message: "user registered successfully" });
  } catch (error) {
    console.error("signup error", error);
    return NextResponse.json(
      { error: "something went wrong" },
      { status: 500 }
    );
  }
}

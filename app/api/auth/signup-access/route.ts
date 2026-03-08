import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    open: process.env.OPEN_SIGNUP === "true",
  });
}

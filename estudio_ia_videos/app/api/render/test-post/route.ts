import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "POST method working!"
  });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "GET method working!"
  });
}

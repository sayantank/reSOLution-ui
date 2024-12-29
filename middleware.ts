import { NextResponse, type NextRequest } from "next/server";
import { encrypt } from "./lib/auth";

export async function middleware(request: NextRequest) {
	const res = NextResponse.next();
	const value = await encrypt({
		app: "reSOLution",
		expires: new Date(Date.now() + 60 * 60 * 1000),
	});

	res.cookies.set({
		name: "session",
		value,
		httpOnly: true,
		expires: new Date(Date.now() + 60 * 60 * 1000),
	});

	return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { encrypt } from "./lib/auth";

export async function middleware(request: NextRequest) {
	const res = NextResponse.next();
	const value = await encrypt({
		app: "reSOLution",
		expires: new Date(Date.now() + 15 * 60 * 1000),
	});

	res.cookies.set({
		name: "session",
		value,
		httpOnly: true,
		expires: new Date(Date.now() + 15 * 60 * 1000),
	});

	return res;
}

export const config = {
	matcher: [
		"/((?!.+\\.[\\w]+$|_next).*)", // Match all routes except static files and Next.js internal routes
		"/", // Match the root route
		"/(api|trpc)(.*)", // Match all API and tRPC routes
		"/robots(.*)", // Match robots.txt related routes
	],
};

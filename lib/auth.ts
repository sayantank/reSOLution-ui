import { SignJWT, jwtVerify, importPKCS8 } from "jose";
import { cookies } from "next/headers";

const privateKey = process.env.IRONFORGE_JWT_SECRET!;

// Clean up the key and ensure proper formatting
const cleanKey = privateKey
	.replace(/\\n/g, "\n") // Convert \n string to actual newlines
	.replace("-----BEGIN RSA PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----")
	.replace("-----END RSA PRIVATE KEY-----", "-----END PRIVATE KEY-----");

// Import the key using jose's importPKCS8
const privateKeyObject = await importPKCS8(cleanKey, "RS256");

export type SessionPayload = {
	app: string;
	expires: Date;
};

export async function encrypt(payload: SessionPayload) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "RS256" })
		.setIssuedAt()
		.setExpirationTime("1 min from now")
		.sign(privateKeyObject);
}

export async function decrypt(input: string): Promise<SessionPayload> {
	const { payload } = await jwtVerify<SessionPayload>(input, privateKeyObject, {
		algorithms: ["RS256"],
	});
	return payload;
}

export async function getSession() {
	const session = (await cookies()).get("session")?.value;
	if (!session) return false;
	return await decrypt(session);
}

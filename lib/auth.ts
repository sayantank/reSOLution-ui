import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Function to convert PEM to Uint8Array
function pemToUint8Array(pem: string): Uint8Array {
	// Remove PEM formatting and decode base64
	const base64 = pem
		.replace("-----BEGIN PRIVATE KEY-----", "")
		.replace("-----END PRIVATE KEY-----", "")
		.replace(/\\n/g, "")
		.replace(/\n/g, "");

	// Decode base64 to binary string
	const binaryString = atob(base64);

	// Convert binary string to Uint8Array
	return new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
}

// Create the key using Web Crypto API
const privateKeyPromise = (async () => {
	const privateKeyData = pemToUint8Array(process.env.IRONFORGE_JWT_SECRET!);

	return await crypto.subtle.importKey(
		"pkcs8",
		privateKeyData,
		{
			name: "RSASSA-PKCS1-v1_5",
			hash: "SHA-256",
		},
		true,
		["sign"],
	);
})();

export type SessionPayload = {
	app: string;
	expires: Date;
};

export async function encrypt(payload: SessionPayload) {
	const privateKey = await privateKeyPromise;
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "RS256" })
		.setIssuedAt()
		.setExpirationTime("1 min from now")
		.sign(privateKey);
}

export async function decrypt(input: string): Promise<SessionPayload> {
	const privateKey = await privateKeyPromise;
	const { payload } = await jwtVerify<SessionPayload>(input, privateKey, {
		algorithms: ["RS256"],
	});
	return payload;
}

export async function getSession() {
	const session = (await cookies()).get("session")?.value;
	if (!session) return false;
	return await decrypt(session);
}

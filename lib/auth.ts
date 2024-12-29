import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Function to convert PEM to Uint8Array
function pemToUint8Array(pem: string): Uint8Array {
	// Remove PEM formatting and decode base64
	const base64 = pem
		.replace("-----BEGIN PRIVATE KEY-----", "")
		.replace("-----END PRIVATE KEY-----", "")
		.replace("-----BEGIN PUBLIC KEY-----", "")
		.replace("-----END PUBLIC KEY-----", "")
		.replace(/\\n/g, "")
		.replace(/\n/g, "")
		.trim();

	if (!base64) {
		throw new Error("Empty key after formatting");
	}

	// Decode base64 to binary string
	try {
		const binaryString = atob(base64);
		return new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
	} catch (error) {
		console.error(`Failed to decode base64: ${base64.slice(0, 10)}...`);
		throw error;
	}
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

const publicKeyPromise = (async () => {
	const publicKeyData = pemToUint8Array(process.env.IRONFORGE_JWT_PUBLIC!);
	return await crypto.subtle.importKey(
		"spki",
		publicKeyData,
		{
			name: "RSASSA-PKCS1-v1_5",
			hash: "SHA-256",
		},
		true,
		["verify"],
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
		.setExpirationTime("15 mins from now")
		.sign(privateKey);
}

export async function decrypt(input: string): Promise<SessionPayload> {
	const publicKey = await publicKeyPromise;
	const { payload } = await jwtVerify<SessionPayload>(input, publicKey, {
		algorithms: ["RS256"],
	});
	return payload;
}

export async function getSession() {
	const token = (await cookies()).get("session")?.value;
	if (!token) return null;
	return {
		payload: await decrypt(token),
		token,
	};
}

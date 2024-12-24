import type { Metadata } from "next";

export function constructMetadata({
	title = "reSOLution",
	description = "Bet on yourself! Turn your resolutions into rewards by staking SOL and earning returns when you succeed.",
	image = "https://resolution-dun.vercel.app/thumbnail.png",
	icons = [],
	canonicalUrl,
	noIndex = false,
}: {
	title?: string;
	description?: string;
	image?: string | null;
	icons?: Metadata["icons"];
	canonicalUrl?: string;
	noIndex?: boolean;
} = {}): Metadata {
	return {
		title,
		description,
		openGraph: {
			title,
			description,
			...(image && {
				images: image,
			}),
		},
		twitter: {
			title,
			description,
			...(image && {
				card: "summary_large_image",
				images: [image],
			}),

			creator: "@sayantanxyz",
		},
		icons,
		metadataBase: new URL("https://resolution-dun.vercel.app"),
		...(canonicalUrl && {
			alternates: {
				canonical: canonicalUrl,
			},
		}),
		...(noIndex && {
			robots: {
				index: false,
				follow: false,
			},
		}),
		keywords: ["solana", "staking", "crypto", "newyears", "resolution"],
	};
}

import { constructMetadata } from "@/lib/metadata";

export async function generateMetadata() {
	return constructMetadata();
}

export default function Home() {
	return (
		<div className="flex flex-col sm:pt-0 px-4 sm:px-0 items-stretch sm:items-center justify-center min-h-full w-full">
			<p className="text-lg text-muted-forground">Deprecated</p>
		</div>
	);
}

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFoundResolutionPage() {
	return (
		<div className="flex flex-col sm:pt-0 px-4 sm:px-0 items-stretch sm:items-center justify-center min-h-full w-full">
			<div className="max-w-3xl">
				<h1 className="text-3xl font-handwriting text-center">
					😕 Oops! We couldn't find a resolution for that address
				</h1>
				<div className="flex w-full items-center space-x-4 mt-6">
					<Link href="/search" className="flex-1">
						<Button type="button" variant="outline" className="w-full">
							Search another resolution
						</Button>
					</Link>
					<Link href="/" className="flex-1">
						<Button type="button" variant="outline" className="w-full">
							Go home
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

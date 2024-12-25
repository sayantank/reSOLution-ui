import { MenuIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTrigger,
} from "./ui/menu";
import WalletButton from "./wallet-btn";
import Link from "next/link";

export default function MenuDrawer() {
	return (
		<Drawer>
			<DrawerTrigger className="sm:hidden">
				<MenuIcon className="size-6" />
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<Link href="/how">
						<p className="text-muted-foreground hover:underline hover:text-primary transition-all">
							How does it work?
						</p>
					</Link>
					<Link href="https://github.com/sayantank/reSOLution" target="_blank">
						<p className="text-muted-foreground hover:underline hover:text-primary transition-all">
							Github
						</p>
					</Link>
				</DrawerHeader>
				<DrawerFooter>
					<WalletButton />
					<DrawerClose>
						<Button className="w-full" variant="outline">
							Cancel
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

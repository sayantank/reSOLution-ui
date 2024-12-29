import type React from "react";
import { cn } from "@/lib/utils";
import { type PostItColor, YELLOW } from "@/app/consts";

interface PostItNoteProps {
	children?: React.ReactNode;
	color?: PostItColor;
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

const PostItNote: React.FC<PostItNoteProps> = ({
	children,
	color = YELLOW,
	value,
	onChange,
	placeholder,
	className,
	disabled,
}) => {
	const colorClasses: Record<PostItColor, string> = {
		yellow: "bg-yellow-200",
		blue: "bg-blue-200",
		green: "bg-green-200",
		pink: "bg-pink-200",
	};

	return (
		<div
			className={cn(
				colorClasses[color],
				"w-full h-96 sm:w-[32rem]",
				"rounded-sm",
				"shadow-md",
				"transform rotate-1",
				"transition-all duration-300 ease-in-out",
				"hover:rotate-0 hover:shadow-lg",
				"cursor-pointer",
				"overflow-hidden",
				"relative",
				className,
			)}
		>
			{/* Sticky part */}
			<div className="absolute top-0 left-0 w-full h-12 bg-black bg-opacity-5" />

			{/* Content */}
			<div className="text-base sm:text-lg text-gray-800 relative z-10 h-full">
				{onChange ? (
					<textarea
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						disabled={disabled}
						className={cn(
							"w-full h-full resize-none bg-transparent no-scrollbar",
							"font-logo",
							"focus:outline-none",
							"placeholder:text-gray-500",
							"absolute inset-0",
							"p-6 pt-14",
							"whitespace-pre-wrap",
						)}
					/>
				) : (
					<div
						className={cn(
							"w-full h-full resize-none bg-transparent no-scrollbar",
							"font-logo",
							"absolute inset-0",
							"p-6 pt-14",
							"whitespace-pre-wrap",
						)}
					>
						{children}
					</div>
				)}
			</div>
		</div>
	);
};

export default PostItNote;

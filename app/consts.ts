export const YELLOW = "yellow";
export const BLUE = "blue";
export const GREEN = "green";
export const PINK = "pink";

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const PostItColors = [YELLOW, BLUE, GREEN, PINK] as const;

export type PostItColor = (typeof PostItColors)[number];

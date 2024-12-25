import { constructMetadata } from "@/lib/metadata";

export async function generateMetadata() {
	return constructMetadata();
}

export default async function HowItWorksPage() {
	return (
		<div className="flex pt-4 flex-col items-center px-4 min-h-full w-full max-w-3xl mx-auto">
			<section className="w-full space-y-8">
				<div className="space-y-4 text-center">
					<h2 className="text-2xl font-medium">🎯 Bet on Your Success</h2>
					<p className="text-gray-600 text-lg">
						Transform your resolutions into achievable goals by putting some
						skin in the game. reSOLution allows you to stake Solana (SOL) as a
						commitment to your personal goals, adding a powerful incentive to
						follow through.
					</p>
				</div>

				<div className="space-y-4 text-center">
					<h2 className="text-2xl font-medium">💰 Earn While You Achieve</h2>
					<p className="text-gray-600 text-lg">
						Your staked SOL doesn't just sit idle – it works for you! When you
						commit to a goal, your stake is placed in a Solana validator,
						earning rewards throughout your journey. Think of it as getting paid
						to achieve your goals.
					</p>
				</div>

				<div className="space-y-4 text-center">
					<h2 className="text-2xl font-medium">👀 Accountability That Works</h2>
					<p className="text-gray-600 text-lg">
						Choose three trusted individuals as your verification committee.
						Once you complete your goal, they'll confirm your success. This
						verification system ensures honesty while keeping you motivated
						throughout your journey.
					</p>
				</div>

				<div className="space-y-4 text-center">
					<h2 className="text-2xl font-medium">📈 Success Has Its Rewards</h2>
					<p className="text-gray-600 text-lg">
						Upon successful completion and verification of your goal, you'll
						receive your entire stake back plus all the rewards earned during
						the lockup period. However, if you don't meet your goal by the
						deadline, you'll get your initial stake back, but the rewards will
						be burned – adding that extra motivation to succeed!
					</p>
				</div>

				<div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
					<p className="text-base text-gray-500">
						New to Solana? Think of it as a modern, eco-friendly digital
						currency that can earn rewards when used in special ways. By staking
						your SOL with us, you're not just saving money – you're potentially
						growing it while working toward your goals.
					</p>
				</div>
			</section>
		</div>
	);
}

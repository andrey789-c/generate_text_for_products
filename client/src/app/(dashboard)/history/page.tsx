import { PageHeader } from "@/components/layout/dashboard-shell";
import { GenerationHistory } from "@/features/generation/ui/generation-history";
export default function HistoryPage() {
	return (
		<>
			<PageHeader
				eyebrow="Библиотека"
				title="История генераций"
				description="Просматривайте и управляйте созданными описаниями."
			/>
			<GenerationHistory />
		</>
	);
}

import { PageHeader } from "@/components/layout/dashboard-shell";
import { GenerationDetails } from "@/features/generation/ui/generation-details";
export default function GenerationDetailPage() {
	return (
		<>
			<PageHeader
				eyebrow="Генерация"
				title="Результат генерации"
				description="Готовый контент для карточки товара."
			/>
			<GenerationDetails />
		</>
	);
}

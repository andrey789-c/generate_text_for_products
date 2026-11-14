import { PageHeader } from "@/components/layout/dashboard-shell";
import { GenerateWorkspace } from "@/features/generate-description/ui/generate-workspace";

export default function GeneratePage() {
	return (
		<>
			<PageHeader
				eyebrow="Создание контента"
				title="Генерация описания товара"
				description="Превратите данные о товаре в готовый к публикации контент."
			/>
			<GenerateWorkspace />
		</>
	);
}

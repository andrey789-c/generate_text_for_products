import { Sparkles } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { DashboardOverview } from "@/features/dashboard/ui/dashboard-overview";
export default function DashboardPage() {
	return (
		<>
			<PageHeader
				eyebrow="Обзор"
				title="Рабочая панель ProductAI"
				description="Генерируйте готовые описания товаров и SEO-метаданные с помощью локального AI."
				action={
					<Link href="/generate">
						<Button className="h-10 bg-[#202328] hover:bg-[#34383e]">
							<Sparkles size={15} /> Создать описание
						</Button>
					</Link>
				}
			/>
			<DashboardOverview />
		</>
	);
}

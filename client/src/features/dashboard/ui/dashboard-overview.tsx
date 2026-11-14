"use client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Package, WandSparkles } from "lucide-react";
import Link from "next/link";
import { generationsApi } from "@/entities/generation/api/generations.api";
import { productsApi } from "@/entities/product/api/products.api";
import { EmptyState, LoadingState } from "@/shared/ui/status";

const toneLabel: Record<string, string> = {
	professional: "Профессиональный",
	sales: "Продающий",
	friendly: "Дружелюбный",
	premium: "Премиальный",
	seo: "SEO",
};
const weekCutoff = Date.now() - 7 * 86400000;
export function DashboardOverview() {
	const products = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
	const generations = useQuery({
		queryKey: ["generations"],
		queryFn: () => generationsApi.list(20),
	});
	const recent = generations.data?.slice(0, 5) ?? [];
	const week = recent.filter((g) => new Date(g.createdAt).getTime() > weekCutoff).length;
	return (
		<div className="mx-auto max-w-[1240px] space-y-7 px-5 py-8 lg:px-10">
			<div className="grid gap-3 sm:grid-cols-3">
				<Stat label="Всего товаров" value={products.data?.length} icon={<Package size={16} />} />
				<Stat
					label="Всего генераций"
					value={generations.data?.length}
					icon={<WandSparkles size={16} />}
				/>
				<Stat label="За последние 7 дней" value={week} icon={<ArrowUpRight size={16} />} />
			</div>
			<section>
				<div className="mb-3 flex items-center justify-between">
					<div>
						<h2 className="text-base font-semibold tracking-[-0.025em]">Последние генерации</h2>
						<p className="mt-1 text-xs text-[#9298a1]">Недавно созданные описания товаров.</p>
					</div>
					<div className="flex items-center gap-4">
						<Link
							href="/products"
							className="text-xs font-medium text-[#727983] hover:text-[#17191c]"
						>
							К товарам
						</Link>
						<Link
							href="/history"
							className="text-xs font-medium text-[#727983] hover:text-[#17191c]"
						>
							Вся история
						</Link>
					</div>
				</div>
				{generations.isLoading ? (
					<LoadingState />
				) : recent.length === 0 ? (
					<EmptyState
						title="Генераций пока нет"
						text="Создайте первое описание товара, чтобы увидеть его здесь."
					/>
				) : (
					<div className="overflow-hidden rounded-2xl border border-[#e2e5e8] bg-white">
						{recent.map((g) => (
							<Link
								key={g.id}
								href={`/history/${g.id}`}
								className="flex items-center gap-4 border-b border-[#eef0f2] px-5 py-4 last:border-0 hover:bg-[#fafafa]"
							>
								<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0f1f3] text-xs font-semibold text-[#6e7680]">
									{g.product?.name?.slice(0, 1).toUpperCase() ?? "P"}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{g.product?.name ?? "Без названия"}
									</p>
									<p className="mt-1 truncate text-xs text-[#9298a1]">
										{g.shortDescription ?? g.description}
									</p>
								</div>
								<span className="hidden rounded-md bg-[#f4f5f6] px-2 py-1 text-[10px] text-[#707781] sm:inline">
									{toneLabel[g.tone] ?? g.tone}
								</span>
								<span className="text-[11px] text-[#a1a7b0]">
									{new Date(g.createdAt).toLocaleDateString("ru-RU")}
								</span>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
function Stat({ label, value, icon }: { label: string; value?: number; icon: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-[#e2e5e8] bg-white p-5">
			<div className="mb-5 flex size-8 items-center justify-center rounded-lg bg-[#f0f1f3] text-[#737a84]">
				{icon}
			</div>
			<p className="text-2xl font-semibold tracking-[-0.05em]">{value ?? "—"}</p>
			<p className="mt-1 text-xs text-[#9298a1]">{label}</p>
		</div>
	);
}

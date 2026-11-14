"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { generationsApi } from "@/entities/generation/api/generations.api";
import { EmptyState, LoadingState } from "@/shared/ui/status";
const toneLabels: Record<string, string> = {
	professional: "Профессиональный",
	sales: "Продающий",
	friendly: "Дружелюбный",
	premium: "Премиальный",
	seo: "SEO",
};
export function GenerationHistory() {
	const qc = useQueryClient();
	const q = useQuery({ queryKey: ["generations"], queryFn: () => generationsApi.list(100) });
	const remove = useMutation({
		mutationFn: generationsApi.remove,
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ["generations"] });
			void qc.invalidateQueries({ queryKey: ["products"] });
		},
	});
	return (
		<div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10">
			{q.isLoading ? (
				<LoadingState />
			) : !q.data?.length ? (
				<EmptyState title="История пуста" text="Созданные описания товаров появятся здесь." />
			) : (
				<div className="overflow-hidden rounded-2xl border border-[#e2e5e8] bg-white">
					{q.data.map((g) => (
						<div
							key={g.id}
							className="flex items-center gap-4 border-b border-[#eef0f2] px-5 py-4 last:border-0"
						>
							<Link href={`/history/${g.id}`} className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold hover:underline">
									{g.product?.name ?? "Без названия"}
								</p>
								<p className="mt-1 truncate text-xs text-[#9298a1]">
									{g.shortDescription ?? g.description}
								</p>
							</Link>
							<span className="hidden rounded-md bg-[#f4f5f6] px-2 py-1 text-[10px] text-[#707781] md:inline">
								{toneLabels[g.tone] ?? g.tone}
							</span>
							<span className="text-[11px] text-[#a1a7b0]">
								{new Date(g.createdAt).toLocaleDateString("ru-RU")}
							</span>
							<button
								aria-label="Удалить генерацию"
								onClick={() => remove.mutate(g.id)}
								className="text-[#a1a7b0] hover:text-red-600"
							>
								<Trash2 size={15} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

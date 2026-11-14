"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { generationsApi } from "@/entities/generation/api/generations.api";
import { CopyButton } from "@/features/copy-generation/ui/copy-button";
import type { Generation } from "@/shared/types";

function Field({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
	return (
		<div className="border-t border-[#eef0f2] py-4 first:border-0">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a1a7b0]">
					{label}
				</span>
				<CopyButton value={value} />
			</div>
			<p
				className={
					large
						? "whitespace-pre-wrap text-[13px] leading-6 text-[#4f5660]"
						: "text-[13px] leading-5 text-[#4f5660]"
				}
			>
				{value || "—"}
			</p>
		</div>
	);
}
interface GenerationResultsProps {
	generations: Generation[];
	onDeleted?: (generationId: string) => void;
}

export function GenerationResults({ generations, onDeleted }: GenerationResultsProps) {
	const qc = useQueryClient();
	const remove = useMutation({
		mutationFn: generationsApi.remove,
		onSuccess: (_, generationId) => {
			void qc.invalidateQueries({ queryKey: ["generations"] });
			void qc.invalidateQueries({ queryKey: ["products"] });
			onDeleted?.(generationId);
		},
	});
	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a1a7b0]">
						Результат
					</p>
					<h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
						Готово вариантов: {generations.length}
					</h2>
				</div>
			</div>
			{generations.map((g, i) => (
				<article
					key={g.id}
					className="overflow-hidden rounded-2xl border border-[#e2e5e8] bg-white shadow-[0_4px_18px_rgba(23,25,28,0.03)]"
				>
					<div className="flex items-center justify-between border-b border-[#eef0f2] px-5 py-4">
						<span className="text-xs font-semibold">Вариант {String(i + 1).padStart(2, "0")}</span>
						<button
							aria-label="Удалить вариант"
							disabled={remove.isPending}
							onClick={() => remove.mutate(g.id)}
							className="text-[#a0a6ae] transition-colors hover:text-red-600"
						>
							<Trash2 size={15} />
						</button>
					</div>
					<div className="px-5 pb-2">
						<Field label="Полное описание" value={g.description} large />
						<Field label="Краткое описание" value={g.shortDescription ?? ""} />
						<Field label="SEO-заголовок" value={g.seoTitle ?? ""} />
						<Field label="Метаописание" value={g.metaDescription ?? ""} />
						<div className="border-t border-[#eef0f2] py-4">
							<div className="mb-2 flex items-center justify-between">
								<span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a1a7b0]">
									Ключевые слова
								</span>
								<CopyButton value={g.keywords.join(", ")} />
							</div>
							<div className="flex flex-wrap gap-1.5">
								{g.keywords.map((k) => (
									<span
										key={k}
										className="rounded-md bg-[#f3f4f5] px-2 py-1 text-[11px] text-[#636b75]"
									>
										{k}
									</span>
								))}
							</div>
						</div>
					</div>
				</article>
			))}
		</section>
	);
}

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generationsApi } from "@/entities/generation/api/generations.api";
import { GenerationResults } from "@/features/generate-description/ui/generation-results";
import { EmptyState, LoadingState } from "@/shared/ui/status";
const toneLabels: Record<string, string> = {
	professional: "Профессиональный",
	sales: "Продающий",
	friendly: "Дружелюбный",
	premium: "Премиальный",
	seo: "SEO",
};
const languageLabels: Record<string, string> = { ru: "Русский", en: "Английский" };
export function GenerationDetails() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["generation", id],
		queryFn: () => generationsApi.get(id),
		enabled: Boolean(id),
	});
	const remove = useMutation({
		mutationFn: () => generationsApi.remove(id),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ["generations"] });
			router.push("/history");
		},
	});
	if (q.isLoading) return <LoadingState />;
	if (!q.data)
		return (
			<div className="p-10">
				<EmptyState title="Генерация не найдена" text="Возможно, результат был удалён." />
			</div>
		);
	const g = q.data;
	return (
		<>
			<div className="flex justify-end gap-2 border-b border-[#e7e9ed] bg-white px-5 py-4 lg:px-10">
				<Link href="/history">
					<Button variant="outline">
						<ArrowLeft size={14} /> Назад
					</Button>
				</Link>
				<Button
					variant="destructive"
					onClick={() => {
						if (window.confirm("Удалить эту генерацию?")) remove.mutate();
					}}
				>
					<Trash2 size={14} /> Удалить
				</Button>
			</div>
			<div className="mx-auto max-w-[800px] px-5 py-8 lg:px-10">
				<div className="mb-6">
					<h1 className="text-[28px] font-semibold tracking-[-0.045em]">
						{g.product?.name ?? "Генерация товара"}
					</h1>
					<p className="mt-1 text-sm text-[#858c95]">
						{toneLabels[g.tone] ?? g.tone} · {languageLabels[g.language] ?? g.language} · {g.model}
					</p>
				</div>
				<GenerationResults
					generations={[g]}
					onDeleted={() => {
						router.push("/history");
					}}
				/>
			</div>
		</>
	);
}

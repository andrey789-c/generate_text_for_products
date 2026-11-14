"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/entities/product/api/products.api";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState, LoadingState } from "@/shared/ui/status";
export function ProductDetails() {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["product", id],
		queryFn: () => productsApi.get(id),
		enabled: Boolean(id),
	});
	const remove = useMutation({
		mutationFn: () => productsApi.remove(id),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ["products"] });
			setConfirmOpen(false);
			router.push("/products");
		},
	});
	if (q.isLoading) return <LoadingState />;
	const p = q.data;
	if (!p)
		return (
			<div className="p-10">
				<EmptyState title="Товар не найден" text="Возможно, товар был удалён." />
			</div>
		);
	return (
		<>
			<div className="flex justify-end gap-2 border-b border-[#e7e9ed] bg-white px-5 py-4 lg:px-10">
				<Link href="/products">
					<Button variant="outline">
						<ArrowLeft size={14} /> Назад
					</Button>
				</Link>
				<Button
					variant="destructive"
					disabled={remove.isPending}
					onClick={() => setConfirmOpen(true)}
				>
					<Trash2 size={14} /> Удалить
				</Button>
			</div>
			<ConfirmDialog
				open={confirmOpen}
				title="Удалить товар?"
				description={`Товар «${p.name}» и связанные с ним данные будут удалены без возможности восстановления.`}
				pending={remove.isPending}
				onCancel={() => setConfirmOpen(false)}
				onConfirm={() => remove.mutate()}
			/>
			<div className="mx-auto grid max-w-[1240px] gap-7 px-5 py-8 lg:grid-cols-[280px_1fr] lg:px-10">
				<aside className="h-fit rounded-2xl border border-[#e2e5e8] bg-white p-5">
					<p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a1a7b0]">
						Информация о товаре
					</p>
					<div className="mt-5 space-y-4 text-sm">
						<div>
							<p className="text-[11px] text-[#9ba1a9]">Бренд</p>
							<p className="mt-1 font-medium">{p.brand || "—"}</p>
						</div>
						<div>
							<p className="text-[11px] text-[#9ba1a9]">Категория</p>
							<p className="mt-1 font-medium">{p.category || "—"}</p>
						</div>
						<div>
							<p className="text-[11px] text-[#9ba1a9]">Аудитория</p>
							<p className="mt-1 leading-5 text-[#59616b]">{p.targetAudience || "—"}</p>
						</div>
						<div>
							<p className="text-[11px] text-[#9ba1a9]">Характеристики</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{p.features.map((f) => (
									<span
										key={f}
										className="rounded-md bg-[#f3f4f5] px-2 py-1 text-[11px] text-[#68717c]"
									>
										{f}
									</span>
								))}
							</div>
						</div>
					</div>
				</aside>
				<section>
					<div className="mb-3">
						<h1 className="text-[28px] font-semibold tracking-[-0.045em]">{p.name}</h1>
						<p className="mt-1 text-sm text-[#858c95]">История генераций товара</p>
					</div>
					{!p.generations?.length ? (
						<EmptyState title="Генераций пока нет" text="Создайте описание для этого товара." />
					) : (
						<div className="space-y-3">
							{p.generations.map((g, i) => (
								<Link
									key={g.id}
									href={`/history/${g.id}`}
									className="block rounded-2xl border border-[#e2e5e8] bg-white p-5 hover:border-[#bfc4ca]"
								>
									<div className="flex items-center justify-between">
										<span className="text-xs font-semibold">Вариант {i + 1}</span>
										<span className="text-[11px] text-[#a1a7b0]">
											{new Date(g.createdAt).toLocaleDateString("ru-RU")}
										</span>
									</div>
									<p className="mt-3 line-clamp-3 text-sm leading-6 text-[#59616b]">
										{g.description}
									</p>
								</Link>
							))}
						</div>
					)}
				</section>
			</div>
		</>
	);
}

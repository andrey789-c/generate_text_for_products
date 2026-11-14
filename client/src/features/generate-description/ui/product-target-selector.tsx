"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, Package, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { productsApi } from "@/entities/product/api/products.api";
import type { GenerationTargetMode, Product } from "@/shared/types";

interface ProductTargetSelectorProps {
	mode: GenerationTargetMode;
	selectedProduct: Product | null;
	onModeChange: (mode: GenerationTargetMode) => void;
	onProductSelect: (product: Product | null) => void;
}

export function ProductTargetSelector({
	mode,
	selectedProduct,
	onModeChange,
	onProductSelect,
}: ProductTargetSelectorProps) {
	const [search, setSearch] = useState("");
	const products = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
	const filteredProducts = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (products.data ?? []).filter((product) =>
			[product.name, product.brand ?? ""].some((value) => value.toLowerCase().includes(query)),
		);
	}, [products.data, search]);

	return (
		<section className="mb-7 rounded-2xl border border-[#e2e5e8] bg-white p-5 shadow-[0_4px_18px_rgba(23,25,28,0.03)] sm:p-7">
			<div className="mb-5">
				<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a1a7b0]">
					Шаг 1
				</p>
				<h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
					К какому товару сохранить генерацию?
				</h2>
				<p className="mt-1 text-xs text-[#9298a1]">
					Выберите существующую карточку или создайте новую.
				</p>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				<TargetCard
					active={mode === "existing"}
					title="Существующий товар"
					description="Добавить новую генерацию к уже сохранённому товару."
					onClick={() => onModeChange("existing")}
				/>
				<TargetCard
					active={mode === "new"}
					title="Новый товар"
					description="Создать новую карточку товара и сохранить генерации в ней."
					onClick={() => onModeChange("new")}
				/>
			</div>
			{mode === "existing" && (
				<div className="mt-5 border-t border-[#eef0f2] pt-5">
					{selectedProduct ? (
						<div className="flex items-center justify-between rounded-xl border border-[#202328] bg-[#f7f8f9] p-3">
							<div className="flex min-w-0 items-center gap-3">
								<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-xs font-semibold">
									{selectedProduct.name.slice(0, 1).toUpperCase()}
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold">{selectedProduct.name}</p>
									<p className="truncate text-xs text-[#858c95]">
										{selectedProduct.brand || "Без бренда"} ·{" "}
										{selectedProduct.generationsCount ?? 0} генераций
									</p>
								</div>
							</div>
							<button
								type="button"
								aria-label="Очистить выбор товара"
								onClick={() => onProductSelect(null)}
								className="rounded-md p-1.5 text-[#9298a1] hover:bg-white hover:text-[#202328]"
							>
								<X size={16} />
							</button>
						</div>
					) : (
						<>
							<div className="flex items-center gap-3 rounded-lg border border-[#dfe2e6] px-3 py-2.5">
								<Search size={15} className="text-[#a1a7b0]" />
								<input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Поиск по названию или бренду"
									className="w-full bg-transparent text-sm outline-none placeholder:text-[#a1a7b0]"
								/>
							</div>
							{products.isLoading ? (
								<p className="py-5 text-center text-xs text-[#9298a1]">Загрузка товаров…</p>
							) : filteredProducts.length ? (
								<div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1">
									{filteredProducts.map((product) => (
										<button
											type="button"
											key={product.id}
											onClick={() => onProductSelect(product)}
											className="flex items-center gap-3 rounded-lg border border-[#e5e7ea] p-3 text-left transition hover:border-[#202328]"
										>
											<div className="grid size-8 shrink-0 place-items-center rounded-md bg-[#f0f1f3] text-xs font-semibold">
												{product.name.slice(0, 1).toUpperCase()}
											</div>
											<div className="min-w-0 flex-1">
												<p className="truncate text-xs font-semibold">{product.name}</p>
												<p className="truncate text-[11px] text-[#9298a1]">
													{product.brand || "Без бренда"} · {product.category || "Без категории"}
												</p>
											</div>
											<span className="text-[10px] text-[#9298a1]">
												{product.generationsCount ?? 0} ген.
											</span>
										</button>
									))}
								</div>
							) : (
								<div className="rounded-xl border border-dashed border-[#dfe2e6] px-5 py-7 text-center">
									<Package className="mx-auto text-[#a1a7b0]" size={20} />
									<p className="mt-2 text-xs font-semibold">Товары не найдены</p>
									<p className="mt-1 text-[11px] text-[#9298a1]">
										Переключитесь на «Новый товар», чтобы создать карточку.
									</p>
									<button
										type="button"
										onClick={() => onModeChange("new")}
										className="mt-3 text-xs font-semibold text-[#202328] underline underline-offset-4"
									>
										Создать новый товар
									</button>
								</div>
							)}
						</>
					)}
				</div>
			)}
		</section>
	);
}

function TargetCard({
	active,
	title,
	description,
	onClick,
}: {
	active: boolean;
	title: string;
	description: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`relative rounded-xl border p-4 text-left transition ${active ? "border-[#202328] bg-[#f7f8f9]" : "border-[#e1e4e7] hover:border-[#aeb4bc]"}`}
		>
			<span
				className={`absolute right-4 top-4 grid size-5 place-items-center rounded-full border ${active ? "border-[#202328] bg-[#202328] text-white" : "border-[#d4d8dd]"}`}
			>
				{active && <Check size={12} />}
			</span>
			<span className="block pr-8 text-sm font-semibold">{title}</span>
			<span className="mt-1 block max-w-[300px] text-xs leading-5 text-[#858c95]">
				{description}
			</span>
		</button>
	);
}

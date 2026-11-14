"use client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { productsApi } from "@/entities/product/api/products.api";
import { EmptyState, LoadingState } from "@/shared/ui/status";
export function ProductsList() {
	const [search, setSearch] = useState("");
	const q = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
	const items = q.data?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) ?? [];
	return (
		<div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10">
			<div className="mb-5 flex items-center gap-3 rounded-xl border border-[#e1e4e7] bg-white px-3 py-2.5 sm:max-w-sm">
				<Search size={15} className="text-[#a1a7b0]" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Поиск товаров"
					className="w-full bg-transparent text-sm outline-none placeholder:text-[#a1a7b0]"
				/>
			</div>
			{q.isLoading ? (
				<LoadingState />
			) : items.length === 0 ? (
				<EmptyState
					title="Товары не найдены"
					text={
						search
							? "Попробуйте изменить поисковый запрос."
							: "Товары появятся после первой генерации."
					}
				/>
			) : (
				<div className="overflow-hidden rounded-2xl border border-[#e2e5e8] bg-white">
					{items.map((p) => (
						<Link
							key={p.id}
							href={`/products/${p.id}`}
							className="flex items-center gap-4 border-b border-[#eef0f2] px-5 py-4 last:border-0 hover:bg-[#fafafa]"
						>
							<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef2f4] text-xs font-semibold text-[#66727c]">
								{p.name.slice(0, 1).toUpperCase()}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold">{p.name}</p>
								<p className="mt-1 text-xs text-[#9298a1]">
									{p.brand || "Без бренда"} {p.category ? `· ${p.category}` : ""}
								</p>
							</div>
							<span className="text-xs text-[#9298a1]">{p.generationsCount ?? 0} генераций</span>
							<ArrowUpRight size={15} className="text-[#a1a7b0]" />
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

"use client";

import { LoaderCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/features/copy-generation/ui/copy-button";
import type { StreamingGenerationContent } from "@/shared/types";

export interface StreamingVariant {
	content: StreamingGenerationContent;
	status: "pending" | "streaming" | "completed";
}

interface StreamingGenerationResultsProps {
	variants: StreamingVariant[];
	status: "loading" | "streaming" | "completed" | "error" | "cancelled";
	error?: string;
	onCancel: () => void;
}

const fields: Array<{ key: keyof StreamingGenerationContent; label: string; large?: boolean }> = [
	{ key: "description", label: "Полное описание", large: true },
	{ key: "shortDescription", label: "Краткое описание" },
	{ key: "seoTitle", label: "SEO-заголовок" },
	{ key: "metaDescription", label: "Метаописание" },
];

export function StreamingGenerationResults({
	variants,
	status,
	error,
	onCancel,
}: StreamingGenerationResultsProps) {
	return (
		<section className="space-y-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a1a7b0]">
						Результат
					</p>
					<h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
						{status === "completed" ? "Генерация завершена" : "Генерация выполняется"}
					</h2>
				</div>
				{(status === "loading" || status === "streaming") && (
					<Button variant="outline" onClick={onCancel} className="shrink-0">
						<Square size={13} /> Остановить
					</Button>
				)}
			</div>
			{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
			{variants.map((variant, index) => (
				<article
					key={index}
					className="overflow-hidden rounded-2xl border border-[#e2e5e8] bg-white shadow-[0_4px_18px_rgba(23,25,28,0.03)]"
				>
					<div className="flex items-center justify-between border-b border-[#eef0f2] px-5 py-4">
						<span className="text-xs font-semibold">
							Вариант {String(index + 1).padStart(2, "0")}
						</span>
						<span className="inline-flex items-center gap-1.5 text-[11px] text-[#9298a1]">
							{variant.status === "streaming" && (
								<LoaderCircle size={13} className="animate-spin" />
							)}
							{variant.status === "completed" ? "Готово" : "Генерируется"}
						</span>
					</div>
					<div className="px-5 pb-2">
						{fields.map(({ key, label, large }) => (
							<StreamingField
								key={key}
								label={label}
								value={variant.content[key] as string}
								large={large}
								active={variant.status === "streaming"}
							/>
						))}
						<div className="border-t border-[#eef0f2] py-4">
							<div className="mb-2 flex items-center justify-between">
								<span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a1a7b0]">
									Ключевые слова
								</span>
								<CopyButton value={variant.content.keywords.join(", ")} />
							</div>
							<div className="flex flex-wrap gap-1.5">
								{variant.content.keywords.map((keyword) => (
									<span
										key={keyword}
										className="rounded-md bg-[#f3f4f5] px-2 py-1 text-[11px] text-[#636b75]"
									>
										{keyword}
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

function StreamingField({
	label,
	value,
	large,
	active,
}: {
	label: string;
	value: string;
	large?: boolean;
	active: boolean;
}) {
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
				{value || "Ожидание текста…"}
				{active && value && (
					<span className="ml-1 inline-block h-3 w-1 animate-pulse bg-[#202328] align-[-1px]" />
				)}
			</p>
		</div>
	);
}

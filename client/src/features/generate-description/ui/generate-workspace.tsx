"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FileStack, PenLine } from "lucide-react";
import { useRef, useState } from "react";
import { streamGeneration } from "@/entities/generation/api/stream-generation.api";
import { BulkGenerationWorkspace } from "@/features/generate-description/ui/bulk-generation-workspace";
import { GenerateForm } from "@/features/generate-description/ui/generate-form";
import { ProductTargetSelector } from "@/features/generate-description/ui/product-target-selector";
import {
	StreamingGenerationResults,
	type StreamingVariant,
} from "@/features/generate-description/ui/streaming-generation-results";
import type {
	CreateGenerationDto,
	GenerationTargetMode,
	Product,
	StreamingGenerationContent,
} from "@/shared/types";

export function GenerateWorkspace() {
	const queryClient = useQueryClient();
	const [generationMode, setGenerationMode] = useState<"single" | "bulk">("single");
	const [productMode, setProductMode] = useState<GenerationTargetMode>("new");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [streamStatus, setStreamStatus] = useState<
		"loading" | "streaming" | "completed" | "error" | "cancelled"
	>("completed");
	const [streamVariants, setStreamVariants] = useState<StreamingVariant[]>([]);
	const [streamError, setStreamError] = useState<string>();
	const abortController = useRef<AbortController | null>(null);
	const emptyContent: StreamingGenerationContent = {
		description: "",
		shortDescription: "",
		seoTitle: "",
		metaDescription: "",
		keywords: [],
	};

	const startStreaming = async (data: CreateGenerationDto) => {
		abortController.current?.abort();
		const controller = new AbortController();
		abortController.current = controller;
		setStreamError(undefined);
		setStreamStatus("loading");
		setStreamVariants(
			Array.from({ length: data.variants }, () => ({
				content: { ...emptyContent, keywords: [] },
				status: "pending" as const,
			})),
		);

		try {
			await streamGeneration(
				data,
				(event) => {
					switch (event.type) {
						case "start":
							setStreamStatus("streaming");
							break;
						case "variant_start":
							setStreamStatus("streaming");
							setStreamVariants((current) =>
								current.map((variant, index) =>
									index === event.data.variantIndex ? { ...variant, status: "streaming" } : variant,
								),
							);
							break;
						case "content":
							setStreamVariants((current) =>
								current.map((variant, index) =>
									index === event.data.variantIndex
										? {
												...variant,
												content: {
													...variant.content,
													[event.data.field]:
														event.data.field === "keywords"
															? [...variant.content.keywords, event.data.content]
															: variant.content[event.data.field] + event.data.content,
												},
											}
										: variant,
								),
							);
							break;
						case "variant_complete":
							setStreamVariants((current) =>
								current.map((variant, index) =>
									index === event.data.variantIndex
										? { content: event.data.generation, status: "completed" }
										: variant,
								),
							);
							break;
						case "complete":
							setStreamStatus("completed");
							void queryClient.invalidateQueries({ queryKey: ["products"] });
							void queryClient.invalidateQueries({ queryKey: ["generations"] });
							break;
						case "error":
							setStreamStatus("error");
							setStreamError(event.data.message);
							break;
					}
				},
				controller.signal,
			);
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return;
			setStreamStatus("error");
			setStreamError(error instanceof Error ? error.message : "Не удалось выполнить генерацию.");
		} finally {
			if (abortController.current === controller) abortController.current = null;
		}
	};

	const cancelStreaming = () => {
		abortController.current?.abort();
		abortController.current = null;
		setStreamStatus("cancelled");
	};
	const isStreaming = streamStatus === "loading" || streamStatus === "streaming";
	return (
		<>
			<div className="mx-auto max-w-[1240px] px-5 pt-8 lg:px-10">
				<div className="grid gap-2 rounded-xl border border-[#e2e5e8] bg-white p-1.5 sm:grid-cols-2">
					<ModeButton
						active={generationMode === "single"}
						icon={<PenLine size={16} />}
						title="Одиночная генерация"
						description="Один товар и точная настройка результата"
						onClick={() => setGenerationMode("single")}
					/>
					<ModeButton
						active={generationMode === "bulk"}
						icon={<FileStack size={16} />}
						title="Массовая генерация"
						description="Массовая обработка CSV, XLSX или JSON"
						onClick={() => setGenerationMode("bulk")}
					/>
				</div>
			</div>
			{generationMode === "bulk" ? (
				<BulkGenerationWorkspace />
			) : (
				<div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10">
					<ProductTargetSelector
						mode={productMode}
						selectedProduct={selectedProduct}
						onModeChange={(nextMode) => {
							setProductMode(nextMode);
							if (nextMode === "new") setSelectedProduct(null);
						}}
						onProductSelect={setSelectedProduct}
					/>
					<div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.86fr)]">
						<GenerateForm
							mode={productMode}
							selectedProductId={selectedProduct?.id}
							isPending={isStreaming}
							errorMessage={streamError}
							onSubmit={startStreaming}
						/>
						<div>
							{streamVariants.length ? (
								<StreamingGenerationResults
									variants={streamVariants}
									status={streamStatus}
									error={streamError}
									onCancel={cancelStreaming}
								/>
							) : (
								<div className="sticky top-8 rounded-2xl border border-dashed border-[#dfe2e6] bg-white/60 px-6 py-14 text-center">
									<div className="mx-auto grid size-11 place-items-center rounded-xl bg-[#eef0f2] text-[#737a84]">
										✦
									</div>
									<h2 className="mt-4 text-sm font-semibold">Здесь появятся результаты</h2>
									<p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#9298a1]">
										Заполните данные о товаре и создайте готовое описание за несколько секунд.
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

function ModeButton({
	active,
	icon,
	title,
	description,
	onClick,
}: {
	active: boolean;
	icon: React.ReactNode;
	title: string;
	description: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${active ? "bg-[#202328] text-white shadow-sm" : "text-[#5f6771] hover:bg-[#f5f6f7]"}`}
		>
			<span className={active ? "text-white" : "text-[#858c95]"}>{icon}</span>
			<span>
				<span className="block text-sm font-semibold">{title}</span>
				<span className={`mt-0.5 block text-[11px] ${active ? "text-white/60" : "text-[#9298a1]"}`}>
					{description}
				</span>
			</span>
		</button>
	);
}

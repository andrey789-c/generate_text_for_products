"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	type GenerateFormValues,
	generateSchema,
} from "@/features/generate-description/model/generate-schema";
import type { CreateGenerationDto, Tone } from "@/shared/types";

const tones: { value: Tone; label: string; hint: string }[] = [
	{ value: "professional", label: "Профессиональный", hint: "Точно и экспертно" },
	{ value: "sales", label: "Продающий", hint: "Акцент на выгодах" },
	{ value: "friendly", label: "Дружелюбный", hint: "Тепло и понятно" },
	{ value: "premium", label: "Премиальный", hint: "Изысканный стиль" },
	{ value: "seo", label: "SEO", hint: "Для поисковых систем" },
];

const input =
	"mt-2 w-full rounded-lg border border-[#dfe2e6] bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-[#b1b6bd] focus:border-[#8a919b] focus:ring-3 focus:ring-[#202328]/5";

interface GenerateFormProps {
	isPending: boolean;
	errorMessage?: string;
	mode: "existing" | "new";
	selectedProductId?: string;
	onSubmit: (data: CreateGenerationDto) => void;
}

export function GenerateForm({
	isPending,
	errorMessage,
	mode,
	selectedProductId,
	onSubmit,
}: GenerateFormProps) {
	const [features, setFeatures] = useState<string[]>([""]);
	const [featureError, setFeatureError] = useState("");
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<GenerateFormValues>({
		resolver: zodResolver(generateSchema),
		defaultValues: { tone: "professional", language: "ru", length: "medium", variants: 2 },
	});

	const submit = (values: GenerateFormValues) => {
		const cleanFeatures = features.map((feature) => feature.trim()).filter(Boolean);
		if (mode === "existing" && !selectedProductId) return;
		if (mode === "new" && !values.productName?.trim()) {
			setError("productName", { message: "Укажите название товара" });
			return;
		}
		if (mode === "new" && !cleanFeatures.length) {
			setFeatureError("Добавьте хотя бы одну характеристику товара");
			return;
		}
		setFeatureError("");
		if (mode === "existing") {
			onSubmit({
				productId: selectedProductId,
				tone: values.tone,
				language: values.language,
				length: values.length,
				variants: values.variants,
			});
			return;
		}
		onSubmit({ ...values, productName: values.productName, features: cleanFeatures });
	};

	return (
		<form
			onSubmit={handleSubmit(submit)}
			className="rounded-2xl border border-[#e2e5e8] bg-white p-5 shadow-[0_4px_18px_rgba(23,25,28,0.03)] sm:p-7"
		>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="font-semibold tracking-[-0.02em]">Данные о товаре</h2>
					<p className="mt-1 text-xs text-[#9298a1]">
						Добавьте контекст, чтобы AI подготовил точный текст.
					</p>
				</div>
				<span className="rounded-md bg-[#f4f5f6] px-2 py-1 text-[10px] font-semibold text-[#858c95]">
					01 / 02
				</span>
			</div>
			{mode === "new" && (
				<div className="grid gap-5 sm:grid-cols-2">
					<label className="sm:col-span-2 text-xs font-medium">
						Название товара <span className="text-[#bc4b4b]">*</span>
						<input
							{...register("productName")}
							placeholder="Например, беспроводные наушники"
							className={input}
						/>
						{errors.productName && (
							<span className="mt-1 block text-xs text-red-600">{errors.productName.message}</span>
						)}
					</label>
					<label className="text-xs font-medium">
						Бренд
						<input {...register("brand")} placeholder="Например, SoundPro" className={input} />
					</label>
					<label className="text-xs font-medium">
						Категория
						<input {...register("category")} placeholder="Например, электроника" className={input} />
					</label>
				</div>
			)}
			{mode === "new" && (
				<div className="mt-6">
					<div className="flex items-end justify-between">
						<label className="text-xs font-medium">
							Основные характеристики <span className="text-[#bc4b4b]">*</span>
						</label>
						<span className="text-[11px] text-[#a1a7b0]">{features.length}/8</span>
					</div>
					<div className="mt-2 space-y-2">
						{features.map((feature, index) => (
							<div className="flex gap-2" key={index}>
								<input
									value={feature}
									onChange={(event) =>
										setFeatures((current) =>
											current.map((item, itemIndex) =>
												itemIndex === index ? event.target.value : item,
											),
										)
									}
									placeholder={index === 0 ? "Например, активное шумоподавление" : "Ещё одна характеристика"}
									className={input + " mt-0"}
								/>
								{features.length > 1 && (
									<button
										type="button"
										onClick={() =>
											setFeatures((current) =>
												current.filter((_, itemIndex) => itemIndex !== index),
											)
										}
										className="rounded-lg border border-[#e1e4e7] px-2.5 text-[#989ea6] hover:text-red-600"
										aria-label="Удалить характеристику"
									>
										<X size={15} />
									</button>
								)}
							</div>
						))}
					</div>
					<button
						type="button"
						disabled={features.length >= 8}
						onClick={() => setFeatures((current) => [...current, ""])}
						className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#656d77] hover:text-[#17191c]"
					>
						<Plus size={14} /> Добавить характеристику
					</button>
					{featureError && <p className="mt-1 text-xs text-red-600">{featureError}</p>}
				</div>
			)}
			{mode === "new" && (
				<label className="mt-6 block text-xs font-medium">
					Целевая аудитория
					<textarea
						{...register("targetAudience")}
						rows={2}
						placeholder="Для кого предназначен этот товар?"
						className={input + " resize-none"}
					/>
				</label>
			)}
			<div className="mt-7 border-t border-[#eef0f2] pt-6">
				<p className="mb-3 text-xs font-medium">Стиль и результат</p>
				<div className="grid gap-2 sm:grid-cols-3">
					{tones.map((tone) => (
						<label key={tone.value} className="relative cursor-pointer">
							<input
								{...register("tone")}
								value={tone.value}
								type="radio"
								className="peer sr-only"
							/>
							<span className="block rounded-lg border border-[#e1e4e7] px-3 py-2.5 transition peer-checked:border-[#202328] peer-checked:bg-[#f5f5f5]">
								<span className="block text-xs font-semibold">{tone.label}</span>
								<span className="mt-0.5 block text-[10px] text-[#9aa0a8]">{tone.hint}</span>
							</span>
						</label>
					))}
				</div>
				<div className="mt-4 grid gap-4 sm:grid-cols-3">
					<label className="text-xs font-medium">
						Язык
						<select {...register("language")} className={input}>
							<option value="ru">Русский</option>
							<option value="en">Английский</option>
						</select>
					</label>
					<label className="text-xs font-medium">
						Длина
						<select {...register("length")} className={input}>
							<option value="short">Короткий текст</option>
							<option value="medium">Средний текст</option>
							<option value="long">Длинный текст</option>
						</select>
					</label>
					<label className="text-xs font-medium">
						Количество вариантов
						<select {...register("variants", { valueAsNumber: true })} className={input}>
							<option value="1">1 вариант</option>
							<option value="2">2 варианта</option>
							<option value="3">3 варианта</option>
						</select>
					</label>
				</div>
			</div>
			{errorMessage && (
				<p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
			)}
			<Button
				type="submit"
				disabled={isPending || (mode === "existing" && !selectedProductId)}
				className="mt-7 h-11 w-full bg-[#202328] text-sm hover:bg-[#34383e]"
			>
				{isPending ? (
					"Генерация…"
				) : mode === "existing" && !selectedProductId ? (
					"Сначала выберите товар"
				) : (
					<>
						<Sparkles size={15} /> Создать описание
					</>
				)}
			</Button>
		</form>
	);
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
	AlertCircle,
	CheckCircle2,
	Download,
	FileSpreadsheet,
	LoaderCircle,
	Upload,
	X,
} from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { bulkGenerationsApi } from "@/entities/generation/api/bulk-generations.api";
import type { BulkMapping, Length, StartBulkJobDto, Tone } from "@/shared/types";

const emptyMapping: BulkMapping = {
	productName: "",
	brand: "",
	category: "",
	features: "",
	targetAudience: "",
};
const mappingLabels: Record<keyof BulkMapping, string> = {
	productName: "Название товара *",
	brand: "Бренд",
	category: "Категория",
	features: "Характеристики",
	targetAudience: "Целевая аудитория",
};
type SelectOption = { value: string; label: string };
const toneOptions: SelectOption[] = [
	{ value: "professional", label: "Профессиональный" },
	{ value: "sales", label: "Продающий" },
	{ value: "friendly", label: "Дружелюбный" },
	{ value: "premium", label: "Премиальный" },
	{ value: "seo", label: "SEO-оптимизированный" },
];
const languageOptions: SelectOption[] = [
	{ value: "ru", label: "Русский" },
	{ value: "en", label: "Английский" },
];
const lengthOptions: SelectOption[] = [
	{ value: "short", label: "Короткий" },
	{ value: "medium", label: "Средний" },
	{ value: "long", label: "Длинный" },
];
const variantsOptions: SelectOption[] = [
	{ value: "1", label: "1 вариант" },
	{ value: "2", label: "2 варианта" },
	{ value: "3", label: "3 варианта" },
];

export function BulkGenerationWorkspace() {
	const inputId = useId();
	const queryClient = useQueryClient();
	const [file, setFile] = useState<File | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [sheetName, setSheetName] = useState<string>();
	const [mapping, setMapping] = useState<BulkMapping | null>(null);
	const [dragging, setDragging] = useState(false);
	const [settings, setSettings] = useState<Omit<StartBulkJobDto, "mapping" | "sheetName">>({
		tone: "professional",
		language: "ru",
		length: "medium",
		variants: 1,
	});

	const upload = useMutation({
		mutationFn: bulkGenerationsApi.upload,
		onSuccess: ({ jobId: id }) => setJobId(id),
	});
	const preview = useQuery({
		queryKey: ["bulk-preview", jobId, sheetName],
		queryFn: () => bulkGenerationsApi.preview(jobId!, sheetName),
		enabled: Boolean(jobId),
	});
	const status = useQuery({
		queryKey: ["bulk-job", jobId],
		queryFn: () => bulkGenerationsApi.get(jobId!),
		enabled: Boolean(jobId),
		refetchInterval: (query) => (query.state.data?.status === "processing" ? 1500 : false),
	});
	const start = useMutation({
		mutationFn: (data: StartBulkJobDto) => bulkGenerationsApi.start(jobId!, data),
		onSuccess: (job) => queryClient.setQueryData(["bulk-job", jobId], job),
	});
	const cancel = useMutation({
		mutationFn: () => bulkGenerationsApi.cancel(jobId!),
		onSuccess: (job) => queryClient.setQueryData(["bulk-job", jobId], job),
	});

	const chooseFile = (selected?: File) => {
		if (!selected) return;
		upload.reset();
		setFile(selected);
		setJobId(null);
		setSheetName(undefined);
		setMapping(null);
		upload.mutate(selected);
	};
	const currentJob = status.data;
	const fileError = upload.error ?? preview.error;
	const isFileLoading = upload.isPending || preview.isLoading;
	const isFileReady = upload.isSuccess && preview.isSuccess;
	const activeMapping = mapping ?? preview.data?.mapping ?? emptyMapping;
	const isRunning = currentJob?.status === "processing";
	const isFinished = ["completed", "completed_with_errors"].includes(currentJob?.status ?? "");
	const progress = currentJob?.totalRows
		? Math.round((currentJob.processedRows / currentJob.totalRows) * 100)
		: 0;

	return (
		<div className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10">
			<section className="rounded-2xl border border-[#e2e5e8] bg-white p-5 shadow-[0_4px_18px_rgba(23,25,28,0.03)] sm:p-7">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a1a7b0]">
							Массовая генерация
						</p>
						<h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
							Загрузите каталог товаров
						</h2>
						<p className="mt-1 text-xs text-[#9298a1]">
							CSV, XLSX или JSON · до 10 МБ · максимум 1000 строк
						</p>
					</div>
					{file && !isRunning && (
						<button
							type="button"
							aria-label="Удалить файл"
							onClick={() => {
								upload.reset();
								setFile(null);
								setJobId(null);
								setSheetName(undefined);
								setMapping(null);
							}}
							className="rounded-lg p-2 text-[#9298a1] hover:bg-[#f3f4f5] hover:text-[#202328]"
						>
							<X size={17} />
						</button>
					)}
				</div>

				{!file ? (
					<label
						htmlFor={inputId}
						onDragEnter={(event) => {
							event.preventDefault();
							setDragging(true);
						}}
						onDragOver={(event) => event.preventDefault()}
						onDragLeave={() => setDragging(false)}
						onDrop={(event) => {
							event.preventDefault();
							setDragging(false);
							chooseFile(event.dataTransfer.files[0]);
						}}
						className={`mt-6 grid cursor-pointer place-items-center rounded-2xl border border-dashed px-6 py-14 text-center transition ${dragging ? "border-[#202328] bg-[#f5f6f7]" : "border-[#d7dbe0] bg-[#fafbfb] hover:border-[#9ca3ab]"}`}
					>
						<input
							id={inputId}
							type="file"
							accept=".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
							className="sr-only"
							onChange={(event) => chooseFile(event.target.files?.[0])}
						/>
						<div className="grid size-12 place-items-center rounded-xl bg-white shadow-sm">
							<Upload size={20} />
						</div>
						<p className="mt-4 text-sm font-semibold">Перетащите файл сюда</p>
						<p className="mt-1 text-xs text-[#9298a1]">или нажмите, чтобы выбрать файл</p>
					</label>
				) : (
					<div className="mt-6 flex items-center gap-3 rounded-xl border border-[#e1e4e7] bg-[#fafbfb] p-4">
						<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white">
							<FileSpreadsheet size={18} />
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-semibold">{file.name}</p>
							<p className="mt-0.5 text-[11px] text-[#9298a1]">
								{formatBytes(file.size)} · {file.name.split(".").pop()?.toUpperCase()}
							</p>
						</div>
						{isFileLoading ? (
							<LoaderCircle className="animate-spin text-[#777f89]" size={18} />
						) : fileError ? (
							<AlertCircle className="text-red-600" size={18} />
						) : isFileReady ? (
							<CheckCircle2 className="text-emerald-600" size={18} />
						) : null}
					</div>
				)}
				{fileError && (
					<ErrorBox
						text={getApiErrorMessage(
							fileError,
							"Не удалось загрузить файл. Проверьте формат, размер и содержимое.",
						)}
					/>
				)}
			</section>

			{preview.data && !isRunning && !isFinished && currentJob?.status !== "cancelled" && (
				<div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
					<section className="rounded-2xl border border-[#e2e5e8] bg-white p-5 sm:p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a1a7b0]">
									Сопоставление
								</p>
								<h3 className="mt-1 text-base font-semibold">Сопоставление полей</h3>
							</div>
							<span className="rounded-md bg-[#f2f3f4] px-2 py-1 text-[11px] text-[#737a84]">
								{preview.data.totalRows} строк
							</span>
						</div>
						{preview.data.sheetNames.length > 1 && (
							<label className="mt-5 block text-xs font-medium">
								Лист Excel
								<select
									value={sheetName ?? preview.data.selectedSheet}
									onChange={(event) => {
										setSheetName(event.target.value);
										setMapping(null);
									}}
									className="mt-2 w-full rounded-lg border border-[#dfe2e6] bg-white px-3 py-2.5 text-sm"
								>
									{preview.data.sheetNames.map((name) => (
										<option key={name}>{name}</option>
									))}
								</select>
							</label>
						)}
						<div className="mt-5 space-y-4">
							{(Object.keys(mappingLabels) as (keyof BulkMapping)[]).map((field) => (
								<label key={field} className="block text-xs font-medium">
									{mappingLabels[field]}
									<select
										value={activeMapping[field]}
										onChange={(event) =>
											setMapping((current) => ({
												...(current ?? activeMapping),
												[field]: event.target.value,
											}))
										}
										className="mt-2 w-full rounded-lg border border-[#dfe2e6] bg-white px-3 py-2.5 text-sm"
									>
										<option value="">Не сопоставлено</option>
										{preview.data.columns.map((column) => (
											<option key={column} value={column}>
												{column}
											</option>
										))}
									</select>
								</label>
							))}
						</div>
						{!activeMapping.productName && <ErrorBox text="Выберите колонку с названием товара." />}
					</section>

					<section className="overflow-hidden rounded-2xl border border-[#e2e5e8] bg-white">
						<div className="border-b border-[#eef0f2] p-5">
							<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a1a7b0]">
								Предпросмотр
							</p>
							<h3 className="mt-1 text-base font-semibold">Первые строки файла</h3>
						</div>
						<div className="overflow-x-auto">
							<table className="min-w-full text-left text-xs">
								<thead className="bg-[#fafbfb] text-[#777f89]">
									<tr>
										{preview.data.columns.map((column) => (
											<th
												key={column}
												className="whitespace-nowrap border-b border-[#eef0f2] px-4 py-3 font-medium"
											>
												{column}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{preview.data.previewRows.slice(0, 10).map((row, index) => (
										<tr key={index} className="border-b border-[#f0f1f2] last:border-0">
											{preview.data.columns.map((column) => (
												<td key={column} className="max-w-64 truncate px-4 py-3 text-[#545c66]">
													{renderCell(row[column])}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="border-t border-[#eef0f2] p-5">
							<h3 className="text-sm font-semibold">Общие настройки</h3>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								<Setting
									label="Стиль текста"
									value={settings.tone}
									onChange={(value) =>
										setSettings((current) => ({ ...current, tone: value as Tone }))
									}
									options={toneOptions}
								/>
								<Setting
									label="Язык"
									value={settings.language}
									onChange={(value) => setSettings((current) => ({ ...current, language: value }))}
									options={languageOptions}
								/>
								<Setting
									label="Длина текста"
									value={settings.length}
									onChange={(value) =>
										setSettings((current) => ({ ...current, length: value as Length }))
									}
									options={lengthOptions}
								/>
								<Setting
									label="Количество вариантов"
									value={String(settings.variants)}
									onChange={(value) =>
										setSettings((current) => ({ ...current, variants: Number(value) }))
									}
									options={variantsOptions}
								/>
							</div>
							<Button
								disabled={!activeMapping.productName || start.isPending}
								onClick={() =>
									start.mutate({
										...settings,
										mapping: activeMapping,
										sheetName: sheetName ?? preview.data.selectedSheet,
									})
								}
								className="mt-5 h-10 w-full bg-[#202328]"
							>
								{start.isPending
									? "Запуск…"
									: `Запустить генерацию · ${preview.data.totalRows} строк`}
							</Button>
							{start.isError && (
								<ErrorBox text="Не удалось запустить задачу. Проверьте сопоставление полей." />
							)}
						</div>
					</section>
				</div>
			)}

			{currentJob && currentJob.status !== "pending" && (
				<section className="mt-6 rounded-2xl border border-[#e2e5e8] bg-white p-6 sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a1a7b0]">
								Ход выполнения
							</p>
							<h3 className="mt-1 text-lg font-semibold">{statusTitle(currentJob.status)}</h3>
							<p className="mt-1 text-xs text-[#9298a1]">
								{currentJob.processedRows} из {currentJob.totalRows} строк обработано
							</p>
						</div>
						<span className="text-3xl font-semibold tracking-[-0.05em]">{progress}%</span>
					</div>
					<div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eceef0]">
						<div
							className="h-full rounded-full bg-[#202328] transition-[width] duration-500"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<div className="mt-5 grid grid-cols-3 gap-3">
						<Metric label="Обработано" value={currentJob.processedRows} />
						<Metric label="Успешно" value={currentJob.successfulRows} />
						<Metric label="Ошибки" value={currentJob.failedRows} />
					</div>
					<div className="mt-6 flex flex-wrap gap-2">
						{isRunning && (
							<Button variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
								{cancel.isPending ? "Отмена…" : "Отменить задачу"}
							</Button>
						)}
						{isFinished && (
							<Button
								onClick={() =>
									bulkGenerationsApi.download(
										currentJob.id,
										`productai-results.${currentJob.originalFormat}`,
									)
								}
								className="bg-[#202328]"
							>
								<Download size={15} /> Скачать результат
							</Button>
						)}
					</div>
				</section>
			)}
		</div>
	);
}

function Setting({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
}) {
	return (
		<label className="text-xs font-medium">
			{label}
			<select
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="mt-2 w-full rounded-lg border border-[#dfe2e6] bg-white px-3 py-2.5 text-sm"
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
}
function Metric({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-xl bg-[#f7f8f9] p-4">
			<p className="text-xl font-semibold">{value}</p>
			<p className="mt-1 text-[11px] text-[#9298a1]">{label}</p>
		</div>
	);
}
function ErrorBox({ text }: { text: string }) {
	return (
		<div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
			<AlertCircle size={15} className="mt-0.5 shrink-0" />
			{text}
		</div>
	);
}
function getApiErrorMessage(error: unknown, fallback: string) {
	if (!isAxiosError<{ message?: string | string[] }>(error)) return fallback;
	const message = error.response?.data?.message;
	if (Array.isArray(message)) return message.join(". ");
	if (message) return message;
	if (error.code === "ERR_NETWORK") {
		return "Не удалось подключиться к API. Проверьте, что сервер запущен на порту 4000.";
	}
	return fallback;
}
function formatBytes(bytes: number) {
	return bytes < 1024 * 1024
		? `${Math.ceil(bytes / 1024)} КБ`
		: `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
function renderCell(value: unknown) {
	return Array.isArray(value) ? value.join(", ") : String(value ?? "—");
}
function statusTitle(status: string) {
	return (
		(
			{
				processing: "Генерация выполняется",
				completed: "Генерация завершена",
				completed_with_errors: "Завершено с ошибками",
				cancelled: "Задача отменена",
				failed: "Задача завершилась ошибкой",
			} as Record<string, string>
		)[status] ?? "Задача подготовлена"
	);
}

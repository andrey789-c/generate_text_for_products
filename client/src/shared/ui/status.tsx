export function LoadingState({ label = "Загрузка…" }: { label?: string }) {
	return (
		<div className="flex min-h-48 items-center justify-center text-sm text-[#8b929c]">
			<span className="mr-2 size-4 animate-spin rounded-full border-2 border-[#dfe2e6] border-t-[#202328]" />
			{label}
		</div>
	);
}
export function EmptyState({ title, text }: { title: string; text: string }) {
	return (
		<div className="rounded-2xl border border-dashed border-[#dfe2e6] bg-white px-6 py-14 text-center">
			<p className="text-sm font-semibold">{title}</p>
			<p className="mx-auto mt-1 max-w-sm text-sm text-[#8b929c]">{text}</p>
		</div>
	);
}

"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	pending?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Удалить",
	pending = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !pending) onCancel();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onCancel, open, pending]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-[#17191c]/35 px-5 backdrop-blur-[2px]"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !pending) onCancel();
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirm-dialog-title"
				className="w-full max-w-[420px] rounded-2xl border border-[#e2e5e8] bg-white p-6 shadow-[0_24px_70px_rgba(23,25,28,0.18)]"
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-3">
						<div className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
							<AlertTriangle size={17} />
						</div>
						<div>
							<h2 id="confirm-dialog-title" className="text-base font-semibold">
								{title}
							</h2>
							<p className="mt-1.5 text-sm leading-5 text-[#737a84]">{description}</p>
						</div>
					</div>
					<button
						type="button"
						aria-label="Закрыть"
						disabled={pending}
						onClick={onCancel}
						className="text-[#a1a7b0] transition-colors hover:text-[#202328] disabled:opacity-50"
					>
						<X size={17} />
					</button>
				</div>
				<div className="mt-6 flex justify-end gap-2">
					<Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
						Отмена
					</Button>
					<Button type="button" variant="destructive" disabled={pending} onClick={onConfirm}>
						{pending ? "Удаление…" : confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}

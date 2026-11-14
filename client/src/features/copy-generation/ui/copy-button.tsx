"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
export function CopyButton({ value, label = "Копировать" }: { value: string; label?: string }) {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			setCopied(false);
		}
	};
	return (
		<button
			onClick={copy}
			className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8a919b] transition-colors hover:text-[#202328]"
		>
			{copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
			{copied ? "Скопировано" : label}
		</button>
	);
}

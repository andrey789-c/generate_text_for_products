"use client";

import {
	Boxes,
	ChevronRight,
	Clock3,
	LayoutDashboard,
	Menu,
	Package,
	Settings,
	Sparkles,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
	{ href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
	{ href: "/generate", label: "Генерация", icon: Sparkles },
	{ href: "/products", label: "Товары", icon: Package },
	{ href: "/history", label: "История", icon: Clock3 },
	{ href: "/settings", label: "Настройки", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	return (
		<div className="min-h-screen bg-[#f7f8fa] text-[#17191c]">
			<button
				aria-label="Открыть меню"
				onClick={() => setOpen(true)}
				className="fixed left-4 top-4 z-30 rounded-lg border bg-white p-2.5 shadow-sm lg:hidden"
			>
				<Menu size={18} />
			</button>
			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex w-[238px] flex-col border-r border-[#e7e9ed] bg-white px-3 py-5 transition-transform lg:translate-x-0",
					open ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex items-center justify-between px-3 pb-8">
					<Link
						href="/dashboard"
						className="flex items-center gap-2.5"
						onClick={() => setOpen(false)}
					>
						<span className="grid size-8 place-items-center rounded-[10px] bg-[#202328] text-white">
							<Boxes size={16} />
						</span>
						<span className="font-semibold tracking-[-0.03em]">ProductAI</span>
					</Link>
					<button
						aria-label="Закрыть меню"
						onClick={() => setOpen(false)}
						className="text-[#969ca5] lg:hidden"
					>
						<X size={18} />
					</button>
				</div>
				<p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a1a7b0]">
					Инструмент
				</p>
				<nav className="space-y-1">
					{nav.map(({ href, label, icon: Icon }) => {
						const active =
							pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
						return (
							<Link
								key={href}
								href={href}
								onClick={() => setOpen(false)}
								className={cn(
									"group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
									active
										? "bg-[#f0f1f3] text-[#17191c]"
										: "text-[#737a84] hover:bg-[#f6f7f8] hover:text-[#202328]",
								)}
							>
								<Icon size={16} strokeWidth={active ? 2.4 : 1.8} />
								<span>{label}</span>
								{active && <ChevronRight size={14} className="ml-auto text-[#9aa0a8]" />}
							</Link>
						);
					})}
				</nav>
				<div className="mt-auto border-t border-[#eceef0] px-2 pt-4">
					<p className="text-xs font-semibold">Локальный AI-инструмент</p>
					<p className="mt-1 text-[11px] leading-4 text-[#9298a1]">Ollama · qwen2.5:3b</p>
					<p className="mt-2 text-[10px] text-[#b0b5bc]">ProductAI v0.1</p>
				</div>
			</aside>
			{open && (
				<button
					aria-label="Закрыть меню"
					onClick={() => setOpen(false)}
					className="fixed inset-0 z-30 bg-black/20 lg:hidden"
				/>
			)}
			<main className="min-h-screen lg:pl-[238px]">{children}</main>
		</div>
	);
}

export function PageHeader({
	eyebrow,
	title,
	description,
	action,
}: {
	eyebrow?: string;
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<header className="flex flex-col gap-4 border-b border-[#e7e9ed] bg-white px-6 py-7 sm:px-10 sm:py-8 md:flex-row md:items-end md:justify-between">
			<div>
				<p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a1a7b0]">
					{eyebrow ?? "Рабочая область"}
				</p>
				<h1 className="text-[28px] font-semibold tracking-[-0.045em] text-[#17191c]">{title}</h1>
				{description && <p className="mt-1.5 text-sm text-[#858c95]">{description}</p>}
			</div>
			{action}
		</header>
	);
}

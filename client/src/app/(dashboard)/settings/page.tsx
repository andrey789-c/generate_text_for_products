import { Cpu, Languages, MonitorCog } from "lucide-react";
import { PageHeader } from "@/components/layout/dashboard-shell";

export default function SettingsPage() {
	return (
		<>
			<PageHeader
				eyebrow="Приложение"
				title="Настройки"
				description="Параметры и сведения о самом инструменте ProductAI."
			/>
			<div className="mx-auto max-w-[900px] space-y-4 px-5 py-8 lg:px-10">
				<div className="rounded-2xl border border-[#e2e5e8] bg-white p-6">
					<div className="flex gap-4">
						<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0f1f3]">
							<Cpu size={16} />
						</div>
						<div>
							<h2 className="text-sm font-semibold">AI-модель</h2>
							<p className="mt-1 text-xs leading-5 text-[#9298a1]">
								Генерация выполняется локально через Ollama. Изменение модели сейчас настраивается в
								конфигурации сервера.
							</p>
							<p className="mt-3 inline-flex rounded-md bg-[#f4f5f6] px-2 py-1 font-mono text-[11px] text-[#656d77]">
								qwen2.5:3b
							</p>
						</div>
					</div>
				</div>
				<div className="rounded-2xl border border-[#e2e5e8] bg-white p-6">
					<div className="flex gap-4">
						<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0f1f3]">
							<Languages size={16} />
						</div>
						<div>
							<h2 className="text-sm font-semibold">Язык генерации</h2>
							<p className="mt-1 text-xs leading-5 text-[#9298a1]">
								По умолчанию используется русский язык. Язык можно изменить непосредственно в форме
								генерации.
							</p>
							<span className="mt-3 inline-flex rounded-md bg-[#f4f5f6] px-2 py-1 text-[11px] text-[#656d77]">
								Русский · RU
							</span>
						</div>
					</div>
				</div>
				<div className="rounded-2xl border border-[#e2e5e8] bg-white p-6">
					<div className="flex gap-4">
						<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0f1f3]">
							<MonitorCog size={16} />
						</div>
						<div>
							<h2 className="text-sm font-semibold">Интерфейс</h2>
							<p className="mt-1 text-xs leading-5 text-[#9298a1]">
								Светлая тема и локальное хранение данных браузера используются по умолчанию.
								Сохранение дополнительных настроек появится вместе с соответствующим API.
							</p>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

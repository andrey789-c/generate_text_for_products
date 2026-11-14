import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/shared/lib/query-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
	title: "ProductAI — описания товаров с помощью AI",
	description: "Создавайте описания товаров и SEO-метаданные с помощью локального AI",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
			<body className="min-h-full">
				<QueryProvider>{children}</QueryProvider>
			</body>
		</html>
	);
}

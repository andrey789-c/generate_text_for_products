import { PageHeader } from "@/components/layout/dashboard-shell";
import { ProductsList } from "@/features/product/ui/products-list";
export default function ProductsPage() {
	return (
		<>
			<PageHeader
				eyebrow="Каталог"
				title="Товары"
				description="Все товары и созданный для них контент в одном месте."
			/>
			<ProductsList />
		</>
	);
}

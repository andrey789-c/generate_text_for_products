import { PageHeader } from "@/components/layout/dashboard-shell";
import { ProductDetails } from "@/features/product/ui/product-details";
export default function ProductDetailPage() {
	return (
		<>
			<PageHeader
				eyebrow="Товар"
				title="Детали товара"
				description="Информация о товаре и история генераций."
			/>
			<ProductDetails />
		</>
	);
}

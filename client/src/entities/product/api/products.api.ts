import { api } from "@/shared/api/client";
import type { Product, UpdateProductDto } from "@/shared/types";

export const productsApi = {
	list: async () => (await api.get<Product[]>("/products")).data,
	get: async (id: string) => (await api.get<Product>(`/products/${id}`)).data,
	update: async (id: string, data: UpdateProductDto) =>
		(await api.patch<Product>(`/products/${id}`, data)).data,
	remove: async (id: string) => (await api.delete(`/products/${id}`)).data,
};

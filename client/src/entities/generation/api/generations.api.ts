import { api } from "@/shared/api/client";
import type { CreateGenerationDto, Generation, GenerationResponse } from "@/shared/types";

export const generationsApi = {
	list: async (limit = 20) => (await api.get<Generation[]>(`/generations?limit=${limit}`)).data,
	get: async (id: string) => (await api.get<Generation>(`/generations/${id}`)).data,
	create: async (data: CreateGenerationDto) =>
		(await api.post<GenerationResponse>("/generations", data)).data,
	remove: async (id: string) => (await api.delete(`/generations/${id}`)).data,
};

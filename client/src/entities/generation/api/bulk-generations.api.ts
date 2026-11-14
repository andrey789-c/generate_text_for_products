import { api } from "@/shared/api/client";
import type { BulkJob, BulkPreview, StartBulkJobDto } from "@/shared/types";

export const bulkGenerationsApi = {
	upload: async (file: File) => {
		const body = new FormData();
		body.append("file", file);
		return (await api.post<{ jobId: string }>("/bulk-generations", body)).data;
	},
	get: async (id: string) => (await api.get<BulkJob>(`/bulk-generations/${id}`)).data,
	preview: async (id: string, sheetName?: string) =>
		(
			await api.get<BulkPreview>(`/bulk-generations/${id}/preview`, {
				params: sheetName ? { sheetName } : undefined,
			})
		).data,
	start: async (id: string, data: StartBulkJobDto) =>
		(await api.post<BulkJob>(`/bulk-generations/${id}/start`, data)).data,
	cancel: async (id: string) => (await api.post<BulkJob>(`/bulk-generations/${id}/cancel`)).data,
	download: async (id: string, fileName: string) => {
		const response = await api.get<Blob>(`/bulk-generations/${id}/download`, {
			responseType: "blob",
		});
		const url = URL.createObjectURL(response.data);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(url);
	},
};

export type Tone = "professional" | "sales" | "friendly" | "premium" | "seo";
export type Length = "short" | "medium" | "long";
export type GenerationTargetMode = "existing" | "new";

export interface Product {
	id: string;
	name: string;
	brand: string | null;
	category: string | null;
	features: string[];
	targetAudience?: string | null;
	createdAt: string;
	updatedAt: string;
	generationsCount?: number;
	generations?: Generation[];
}

export interface Generation {
	id: string;
	productId: string | null;
	description: string;
	shortDescription: string | null;
	seoTitle: string | null;
	metaDescription: string | null;
	keywords: string[];
	tone: Tone;
	language: string;
	model: string;
	createdAt: string;
	product?: Pick<Product, "id" | "name" | "brand">;
}

export interface CreateGenerationDto {
	productId?: string;
	productName?: string;
	brand?: string;
	category?: string;
	features?: string[];
	targetAudience?: string;
	tone: Tone;
	language: string;
	length: Length;
	variants: number;
}

export interface UpdateProductDto {
	name?: string;
	brand?: string;
	category?: string;
	features?: string[];
}

export interface GenerationResponse {
	productId: string;
	generations: Generation[];
}

export type StreamingGenerationField =
	| "description"
	| "shortDescription"
	| "seoTitle"
	| "metaDescription"
	| "keywords";

export interface StreamingGenerationContent {
	description: string;
	shortDescription: string;
	seoTitle: string;
	metaDescription: string;
	keywords: string[];
}

export type StreamingGenerationEvent =
	| { type: "start"; data: { variants: number } }
	| { type: "variant_start"; data: { variantIndex: number } }
	| {
			type: "content";
			data: {
				variantIndex: number;
				field: StreamingGenerationField;
				content: string;
			};
	  }
	| {
			type: "variant_complete";
			data: { variantIndex: number; generation: StreamingGenerationContent & { id: string } };
	  }
	| {
			type: "complete";
			data: { productId: string; generations: Array<StreamingGenerationContent & { id: string }> };
	  }
	| { type: "error"; data: { message: string; variantIndex?: number } };

export type BulkJobStatus =
	| "pending"
	| "processing"
	| "completed"
	| "completed_with_errors"
	| "failed"
	| "cancelled";

export interface BulkMapping {
	productName: string;
	brand: string;
	category: string;
	features: string;
	targetAudience: string;
}

export interface BulkJob {
	id: string;
	status: BulkJobStatus;
	originalFileName: string;
	originalFormat: "csv" | "xlsx" | "json";
	totalRows: number;
	processedRows: number;
	successfulRows: number;
	failedRows: number;
	settings: Record<string, unknown>;
	mapping: BulkMapping;
	columns: string[];
	sheetNames: string[];
	selectedSheet?: string;
	createdAt: string;
	completedAt?: string;
}

export interface BulkPreview extends BulkJob {
	previewRows: Record<string, unknown>[];
}

export interface StartBulkJobDto {
	mapping: BulkMapping;
	sheetName?: string;
	tone: Tone;
	language: string;
	length: Length;
	variants: number;
}

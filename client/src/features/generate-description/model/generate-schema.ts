import { z } from "zod";

export const generateSchema = z.object({
	productName: z.string().optional(),
	brand: z.string().optional(),
	category: z.string().optional(),
	targetAudience: z.string().optional(),
	tone: z.enum(["professional", "sales", "friendly", "premium", "seo"]),
	language: z.string(),
	length: z.enum(["short", "medium", "long"]),
	variants: z.number().min(1).max(3),
});

export type GenerateFormValues = z.infer<typeof generateSchema>;

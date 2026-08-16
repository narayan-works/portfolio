import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		category: z.string().optional(), // 'thinking', 'embodied', 'spatial', 'strategy'
		heroImage: z.string().optional(),
		order: z.number().optional().default(0),
		tags: z.array(z.string()).optional(),
		ctaUrl: z.string().optional(),
		ctaText: z.string().optional(),
		// When true, listing cards/rows link straight to ctaUrl instead of the
		// case study page (for projects that live entirely at their live site).
		linkToCta: z.boolean().optional().default(false),
// Flexible metadata - add any key-value pairs here
		meta: z.record(z.string()).optional(), // { "Course": "...", "Duration": "3 days", "Type": "Hackathon", ... }
        // Bento Grid Sizing
        bentoSize: z.enum(['large', 'medium', 'small', 'wide', 'tall']).optional().default('small'),
		// Optional override for sidebar sections
		sections: z.array(z.object({
			id: z.string(),
			label: z.string()
		})).optional(),
	}),
});

export const collections = { projects };

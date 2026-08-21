import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const argumente = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/argumente' }),
  schema: z.object({
    modul: z.string(),
    title: z.string(),
    og_title: z.string().optional(),
    beschreibung: z.string(),
    stand: z.string(),
    naechstes_modul: z.string().optional(),
  }),
});

const mythen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/mythen' }),
  schema: z.object({
    title: z.string(),
    frage: z.string(),
    kurzantwort: z.string(),
    beschreibung: z.string(),
    stand: z.string(),
  }),
});

export const collections = { argumente, mythen };

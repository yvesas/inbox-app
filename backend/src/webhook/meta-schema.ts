import { z } from "zod";

/**
 * Subconjunto do payload do webhook da WhatsApp Cloud API que nos interessa.
 * Campos não usados ficam opcionais para não rejeitar payloads válidos.
 */
const messageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string().optional(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
});

const contactSchema = z.object({
  profile: z.object({ name: z.string() }).optional(),
  wa_id: z.string(),
});

const changeValueSchema = z.object({
  messaging_product: z.string().optional(),
  metadata: z
    .object({
      display_phone_number: z.string().optional(),
      phone_number_id: z.string(),
    })
    .optional(),
  contacts: z.array(contactSchema).optional(),
  messages: z.array(messageSchema).optional(),
});

export const metaWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: changeValueSchema,
        }),
      ),
    }),
  ),
});

export type MetaWebhook = z.infer<typeof metaWebhookSchema>;
export type MetaMessage = z.infer<typeof messageSchema>;

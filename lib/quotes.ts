import { supabase } from "@/lib/supabase";

export type CreateQuoteInput = {
  vendorId: string;
  leadId: string;
  quoteAmount: number;
  currency?: string;
  estimatedDays?: number | null;
  quoteMessage?: string;
};

export async function createVendorQuote(input: CreateQuoteInput) {
  const payload = {
    vendor_id: input.vendorId,
    lead_id: input.leadId,
    quote_amount: input.quoteAmount,
    currency: input.currency || "USD",
    estimated_days:
      typeof input.estimatedDays === "number" && !Number.isNaN(input.estimatedDays)
        ? input.estimatedDays
        : null,
    quote_message: input.quoteMessage?.trim() || null,
    status: "sent",
  };

  const { data, error } = await supabase
    .from("vendor_quotes")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateLeadStatus(leadId: string, status: string) {
  const { error } = await supabase
    .from("vendor_leads")
    .update({ status })
    .eq("id", leadId);

  if (error) throw error;
}
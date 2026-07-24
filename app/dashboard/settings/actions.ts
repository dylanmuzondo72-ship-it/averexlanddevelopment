"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/dashboard/access";
import type { SettingsFormState } from "@/lib/dashboard/settings-validation";
import { validateSettingsForm } from "@/lib/dashboard/settings-validation";

export async function updateCompanySettingsAction(
  settingsId: string,
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const { supabase } = await requireRoles(["administrator"]);
  const validation = validateSettingsForm(formData);

  if (!validation.valid) {
    return {
      values: validation.values,
      fieldErrors: validation.fieldErrors,
      formError: "Correct the highlighted settings fields.",
    };
  }

  const { data, error } = await supabase.rpc("update_company_settings", {
    target_settings_id: settingsId,
    new_company_name: validation.values.companyName,
    new_slogan: validation.values.slogan,
    new_ceo_name: validation.values.ceoName,
    new_address: validation.values.address,
    new_primary_phone: validation.values.primaryPhone,
    new_alternative_phone: validation.values.alternativePhone,
    new_primary_email: validation.values.primaryEmail,
    new_alternative_email: validation.values.alternativeEmail,
    new_default_currency: validation.values.defaultCurrency,
    new_default_tax_rate: validation.parsed.taxRate,
    new_default_quote_terms: validation.values.defaultQuoteTerms,
    new_default_invoice_terms: validation.values.defaultInvoiceTerms,
    new_quote_prefix: validation.values.quotePrefix,
    new_invoice_prefix: validation.values.invoicePrefix,
    new_receipt_prefix: validation.values.receiptPrefix,
    new_land_listing_prefix: validation.values.landListingPrefix,
    new_client_prefix: validation.values.clientPrefix,
    new_google_maps_query: validation.values.googleMapsQuery,
    new_google_maps_embed_url: validation.values.googleMapsEmbedUrl,
    new_social_links: validation.parsed.socialLinks,
    new_tax_details: validation.parsed.taxDetails,
    new_banking_details: validation.parsed.bankingDetails,
    new_ecocash_details: validation.parsed.ecocashDetails,
    new_logo_path: validation.values.logoPath,
  });

  if (error || !data) {
    return {
      values: validation.values,
      fieldErrors: {},
      formError:
        "Company settings could not be saved. Review the values and try again.",
    };
  }

  revalidatePath("/dashboard/settings");
  return {
    values: validation.values,
    fieldErrors: {},
    message: "Company settings were updated successfully.",
  };
}

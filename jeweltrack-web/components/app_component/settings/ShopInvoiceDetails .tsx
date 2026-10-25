"use client";

import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Sparkles, Receipt, FileText, Wand2, Info } from "lucide-react";

type FormData = {
  invoice_prefix: string;
  estimate_prefix: string;
  scheme_prefix: string;
  terms_conditions: string;
};

function deriveInitials(shopName?: string): {
  inv: string;
  est: string;
  sch: string;
} {
  if (!shopName || !shopName.trim()) {
    return { inv: "BILL-", est: "EST-", sch: "GS-" };
  }
  const words = shopName
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  let acronym = "";
  if (words.length === 1) {
    acronym = words[0].slice(0, 3).toUpperCase();
  } else {
    acronym = words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
  }
  if (!acronym) acronym = "JW";

  return {
    inv: `${acronym}-`,
    est: `${acronym}-EST-`,
    sch: `${acronym}-SCH-`,
  };
}

const ShopInvoiceDetails = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["shop-profile"],
    queryFn: () => api.get("/settings/shop-profile").then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      invoice_prefix: "",
      estimate_prefix: "",
      scheme_prefix: "",
      terms_conditions: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        invoice_prefix: data.invoice_prefix ?? "",
        estimate_prefix: data.estimate_prefix ?? "",
        scheme_prefix: data.scheme_prefix ?? "GS-",
        terms_conditions: data.terms_conditions ?? "",
      });
    }
  }, [data, reset]);

  const watchedInvoice = watch("invoice_prefix") || "";
  const watchedEstimate = watch("estimate_prefix") || "";
  const watchedScheme = watch("scheme_prefix") || "";

  const handleAutoSuggest = () => {
    if (!data?.shop_name) {
      toast.info("Please set your shop name in Shop Profile first.");
      return;
    }
    const derived = deriveInitials(data.shop_name);
    setValue("invoice_prefix", derived.inv, { shouldValidate: true });
    setValue("estimate_prefix", derived.est, { shouldValidate: true });
    setValue("scheme_prefix", derived.sch, { shouldValidate: true });
    toast.success(`Prefixes auto-suggested based on "${data.shop_name}"`);
  };

  const mutation = useMutation({
    mutationFn: (payload: FormData) =>
      api.patch("/settings/shop-profile/invoice", payload),

    onSuccess: () => {
      toast.success("Invoice & Scheme settings updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["shop-profile"],
      });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update invoice settings"
      );
    },
  });

  return (
    <form
      onSubmit={handleSubmit((formData) => mutation.mutate(formData))}
      className="bg-white rounded-2xl border border-slate-200 mt-5 p-6 sm:p-8 space-y-8 shadow-xs"
    >
      {/* Header with info & auto-suggest helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            Document Numbering & Prefixes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize unique serial prefixes for invoices, estimates, and customer gold savings scheme accounts.
          </p>
        </div>

        {data?.shop_name && (
          <button
            type="button"
            onClick={handleAutoSuggest}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            Auto-suggest from "{data.shop_name}"
          </button>
        )}
      </div>

      {/* Grid of Prefix Inputs with live previews */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 1. Invoice Prefix */}
        <div className="space-y-2">
          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Invoice Prefix *</span>
            <span className="text-[10px] text-slate-400 font-normal">Max 10 chars</span>
          </label>

          <input
            {...register("invoice_prefix", {
              required: "Invoice prefix is required",
              maxLength: {
                value: 10,
                message: "Maximum 10 characters",
              },
            })}
            placeholder="BILL-"
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />

          {/* Live Preview */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Preview:</span>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              {watchedInvoice.trim() || "BILL-"}001
            </span>
          </div>

          {errors.invoice_prefix && (
            <p className="text-red-500 text-xs mt-1">
              {errors.invoice_prefix.message}
            </p>
          )}
        </div>

        {/* 2. Estimate Prefix */}
        <div className="space-y-2">
          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Estimate Prefix *</span>
            <span className="text-[10px] text-slate-400 font-normal">Max 10 chars</span>
          </label>

          <input
            {...register("estimate_prefix", {
              required: "Estimate prefix is required",
              maxLength: {
                value: 10,
                message: "Maximum 10 characters",
              },
            })}
            placeholder="EST-"
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />

          {/* Live Preview */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Preview:</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              {watchedEstimate.trim() || "EST-"}001
            </span>
          </div>

          {errors.estimate_prefix && (
            <p className="text-red-500 text-xs mt-1">
              {errors.estimate_prefix.message}
            </p>
          )}
        </div>

        {/* 3. Gold Savings Scheme Prefix */}
        <div className="space-y-2">
          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Gold Scheme Prefix *
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Max 15 chars</span>
          </label>

          <input
            {...register("scheme_prefix", {
              required: "Gold scheme prefix is required",
              maxLength: {
                value: 15,
                message: "Maximum 15 characters",
              },
            })}
            placeholder="GS- or SCH-"
            className="w-full border border-amber-300 bg-amber-50/10 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />

          {/* Live Preview */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Preview:</span>
            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              {watchedScheme.trim() || "GS-"}0001
            </span>
          </div>

          {errors.scheme_prefix && (
            <p className="text-red-500 text-xs mt-1">
              {errors.scheme_prefix.message}
            </p>
          )}
        </div>
      </div>

      {/* Info Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Sequential Safety Notice: </span>
          Changing prefixes only affects new invoices and newly opened scheme accounts. Previously issued bills and existing scheme passbooks will retain their historical numbers permanently.
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-2">
        <label className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Terms & Conditions (Printed on Invoice Footer)
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Max 1000 chars</span>
        </label>

        <textarea
          rows={5}
          {...register("terms_conditions", {
            maxLength: {
              value: 1000,
              message: "Maximum 1000 characters",
            },
          })}
          placeholder="Goods once sold cannot be returned. Gold items are guaranteed for 916 BIS Hallmark purity. Please preserve this invoice for future reference."
          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
        />

        {errors.terms_conditions && (
          <p className="text-red-500 text-xs mt-1">
            {errors.terms_conditions.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer text-sm disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Numbering & Settings"}
        </button>
      </div>
    </form>
  );
};

export default ShopInvoiceDetails;
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

  const inputClass =
    "w-full h-8 sm:h-8.5 border border-slate-300 rounded-lg px-2.5 text-[11px] sm:text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-800 transition-all";

  const labelClass =
    "font-bold text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 flex items-center justify-between";

  return (
    <form
      onSubmit={handleSubmit((formData) => mutation.mutate(formData))}
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3"
    >
      {/* Header with info & auto-suggest helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
            <span>Document Numbering & Prefixes</span>
          </h2>
          <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5">
            Customize unique serial prefixes for invoices, estimates, and gold savings schemes.
          </p>
        </div>

        {data?.shop_name && (
          <button
            type="button"
            onClick={handleAutoSuggest}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Wand2 className="w-3 h-3 text-amber-600" />
            <span>Auto-suggest prefix</span>
          </button>
        )}
      </div>

      {/* Grid of Prefix Inputs with live previews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. Invoice Prefix */}
        <div className="space-y-1">
          <label className={labelClass}>
            <span>Invoice Prefix *</span>
            <span className="text-[9px] text-slate-400 font-normal">Max 10 chars</span>
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
            className={inputClass}
          />

          {/* Live Preview */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">Preview:</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
              {watchedInvoice.trim() || "BILL-"}001
            </span>
          </div>

          {errors.invoice_prefix && (
            <p className="text-red-500 text-[10px] mt-0.5 font-semibold">
              {errors.invoice_prefix.message}
            </p>
          )}
        </div>

        {/* 2. Estimate Prefix */}
        <div className="space-y-1">
          <label className={labelClass}>
            <span>Estimate Prefix *</span>
            <span className="text-[9px] text-slate-400 font-normal">Max 10 chars</span>
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
            className={inputClass}
          />

          {/* Live Preview */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">Preview:</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
              {watchedEstimate.trim() || "EST-"}001
            </span>
          </div>

          {errors.estimate_prefix && (
            <p className="text-red-500 text-[10px] mt-0.5 font-semibold">
              {errors.estimate_prefix.message}
            </p>
          )}
        </div>

        {/* 3. Gold Savings Scheme Prefix */}
        <div className="space-y-1">
          <label className={labelClass}>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Scheme Prefix *
            </span>
            <span className="text-[9px] text-slate-400 font-normal">Max 15 chars</span>
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
            className={`${inputClass} border-amber-300 bg-amber-50/10`}
          />

          {/* Live Preview */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">Preview:</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
              {watchedScheme.trim() || "GS-"}0001
            </span>
          </div>

          {errors.scheme_prefix && (
            <p className="text-red-500 text-[10px] mt-0.5 font-semibold">
              {errors.scheme_prefix.message}
            </p>
          )}
        </div>
      </div>

      {/* Info Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start gap-2 text-[10px] sm:text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700">Sequential Safety Notice: </span>
          Changing prefixes only affects new documents. Previously issued invoices and passbooks permanently retain their numbers.
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-1">
        <label className={labelClass}>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-400" />
            Terms & Conditions (Printed on Invoice)
          </span>
          <span className="text-[9px] text-slate-400 font-normal">Max 1000 chars</span>
        </label>

        <textarea
          rows={2}
          {...register("terms_conditions", {
            maxLength: {
              value: 1000,
              message: "Maximum 1000 characters",
            },
          })}
          placeholder="Goods once sold cannot be returned. Gold items are guaranteed for 916 BIS Hallmark purity."
          className="w-full border border-slate-300 rounded-lg p-2.5 text-[11px] sm:text-xs font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-800 transition-all"
        />

        {errors.terms_conditions && (
          <p className="text-red-500 text-[10px] mt-0.5 font-semibold">
            {errors.terms_conditions.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-7.5 sm:h-8 px-4 rounded-lg shadow-xs transition-all cursor-pointer text-[11px] sm:text-xs disabled:opacity-50"
        >
          {mutation.isPending ? "Saving..." : "Save Numbering & Settings"}
        </button>
      </div>
    </form>
  );
};

export default ShopInvoiceDetails;
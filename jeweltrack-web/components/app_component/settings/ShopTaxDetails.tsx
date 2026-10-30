"use client";

import api from "@/lib/axios";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Receipt } from "lucide-react";

type FormData = {
  gstin: string;
  pan: string;
};

const ShopTaxDetails = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["shop-profile"],
    queryFn: () =>
      api.get("/settings/shop-profile").then((r) => r.data),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      gstin: data?.gstin ?? "",
      pan: data?.pan ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: FormData) =>
      api.patch("/settings/shop-profile/tax", payload),
    onSuccess: () => {
      toast.success("Tax & GST details updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["shop-profile"],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update tax details");
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        gstin: data.gstin ?? "",
        pan: data.pan ?? "",
      });
    }
  }, [data, reset]);

  const inputClass =
    "mt-1 w-full h-8 sm:h-8.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-900 border border-slate-300 rounded-lg px-2.5 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-300 transition-all";

  const labelClass =
    "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between";

  return (
    <form
      onSubmit={handleSubmit((formData) => mutation.mutate(formData))}
      className="bg-white border border-slate-200 shadow-xs rounded-xl p-3 sm:p-4 space-y-3"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-600" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">Tax Registration (GSTIN & PAN)</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        <div>
          <label className={labelClass}>
            <span>GSTIN <span className="text-rose-500">*</span></span>
            <span className="text-[9px] text-slate-400 font-normal">15 Chars</span>
          </label>
          <input
            {...register("gstin", {
              required: "GSTIN is required",
              pattern: {
                value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: "Invalid GSTIN format",
              },
            })}
            placeholder="e.g. 33ABCDE1234F1Z5"
            maxLength={15}
            className={inputClass}
          />
          {errors.gstin && (
            <p className="mt-0.5 text-[10px] font-semibold text-rose-500">
              {errors.gstin.message}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>
            <span>PAN Number</span>
            <span className="text-[9px] text-slate-400 font-normal">10 Chars</span>
          </label>
          <input
            {...register("pan", {
              pattern: {
                value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                message: "Invalid PAN format",
              },
            })}
            placeholder="e.g. ABCDE1234F"
            maxLength={10}
            className={inputClass}
          />
          {errors.pan && (
            <p className="mt-0.5 text-[10px] font-semibold text-rose-500">
              {errors.pan.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-7.5 sm:h-8 px-4 rounded-lg shadow-xs transition-all cursor-pointer text-[11px] sm:text-xs disabled:opacity-50"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Tax Details"}
        </button>
      </div>
    </form>
  );
};

export default ShopTaxDetails;
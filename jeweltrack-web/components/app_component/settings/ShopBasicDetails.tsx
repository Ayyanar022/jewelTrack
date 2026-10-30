"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

type ShopProfileForm = {
  shop_name: string;
  owner_name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
};

const ShopBasicDetails = () => {
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
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShopProfileForm>({
    defaultValues: {
      shop_name: "",
      owner_name: "",
      address: "",
      phone: "",
      whatsapp: "",
      email: "",
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        shop_name: data.shop_name ?? "",
        owner_name: data.owner_name ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        whatsapp: data.whatsapp ?? "",
        email: data.email ?? "",
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: ShopProfileForm) => {
      if (data?.id) {
        return api.patch("/settings/shop-profile", payload);
      }
      return api.post("/settings/shop-profile", payload);
    },
    onSuccess: () => {
      toast.success("Shop profile details updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["shop-profile"],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update shop profile");
    },
  });

  const onSubmit = (values: ShopProfileForm) => {
    mutation.mutate(values);
  };

  const inputClass =
    "mt-1 w-full h-8 sm:h-8.5 text-[11px] sm:text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-300 transition-all";

  const labelClass =
    "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500";

  if (isSubmitting) return <p className="text-[11px] text-slate-400 p-3">Loading shop details...</p>;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-amber-600" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">Showroom Profile & Contact Details</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        <div>
          <label className={labelClass}>
            <span>Shop Name *</span>
          </label>
          <input
            {...register("shop_name", {
              required: "Shop name is required",
            })}
            placeholder="e.g. Sri Lakshmi Jewellers"
            className={inputClass}
          />
          {errors.shop_name && (
            <p className="text-red-500 text-[10px] mt-0.5 font-semibold">{errors.shop_name?.message}</p>
          )}
        </div>

        <div>
          <label className={labelClass}>
            <span>Owner Name</span>
          </label>
          <input
            {...register("owner_name")}
            placeholder="e.g. R. Subramanian"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <span>Phone</span>
          </label>
          <input
            {...register("phone")}
            placeholder="e.g. 9876543210"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <span>WhatsApp</span>
          </label>
          <input
            {...register("whatsapp")}
            placeholder="e.g. 9876543210"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <span>Email</span>
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder="e.g. contact@lakshmijewels.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          <span>Address</span>
        </label>
        <textarea
          rows={2}
          {...register("address")}
          placeholder="Showroom street address, city, pincode"
          className="mt-1 w-full text-[11px] sm:text-xs font-medium text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-300 transition-all"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          disabled={mutation.isPending}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-7.5 sm:h-8 px-4 rounded-lg shadow-xs transition-all cursor-pointer text-[11px] sm:text-xs disabled:opacity-50"
        >
          {mutation.isPending
            ? "Saving..."
            : data?.id
            ? "Update Profile"
            : "Save Profile"}
        </button>
      </div>
    </form>
  );
};

export default ShopBasicDetails;
"use client";

import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

type FormData = {
  invoice_prefix: string;
  estimate_prefix: string;
  terms_conditions: string;
};

const ShopInvoiceDetails = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["shop-profile"],
    queryFn: () =>
      api.get("/settings/shop-profile").then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      invoice_prefix: data?.invoice_prefix ?? "",
      estimate_prefix: data?.estimate_prefix ?? "",
      terms_conditions: data?.terms_conditions ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: FormData) =>
      api.patch("/settings/shop-profile/invoice", payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shop-profile"],
      });
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="bg-white rounded-xl border mt-5 p-6 space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-5">

        <div>
          <label className="font-medium text-sm">
            Invoice Prefix *
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
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.invoice_prefix?.message}
          </p>
        </div>

        <div>
          <label className="font-medium text-sm">
            Estimate Prefix *
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
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />

          <p className="text-red-500 text-sm mt-1">
            {errors.estimate_prefix?.message}
          </p>
        </div>

      </div>

      <div>

        <label className="font-medium text-sm">
          Terms & Conditions
        </label>

        <textarea
          rows={6}
          {...register("terms_conditions", {
            maxLength: {
              value: 1000,
              message: "Maximum 1000 characters",
            },
          })}
          placeholder="Goods once sold cannot be returned. Please preserve this invoice for future reference."
          className="w-full border rounded-lg px-3 py-2 mt-1"
        />

        <p className="text-red-500 text-sm mt-1">
          {errors.terms_conditions?.message}
        </p>

      </div>

      <div className="flex justify-end">

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          {mutation.isPending ? "Saving..." : "Save"}
        </button>

      </div>

    </form>
  );
};

export default ShopInvoiceDetails;
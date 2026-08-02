

"use client";

import api from "@/lib/axios";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

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
        formState: {
            errors,
            isSubmitting,
        },
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
      queryClient.invalidateQueries({
        queryKey: ["shop-profile"],
      });
    },
  });

    useEffect(()=>{
        if(data){
            reset({
                gstin :data.gstin ?? "",
                pan : data.pan ?? "",
            })
        }
    },[data,reset])

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="bg-white border rounded-xl p-6 space-y-5"
    >
     <div className="grid md:grid-cols-2 gap-5">

  <div>
    <label className="block mb-2 text-sm font-medium">
      GSTIN <span className="text-red-500">*</span>
    </label>

    <input
      {...register("gstin", {
        required: "GSTIN is required",
        pattern: {
          value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
          message: "Invalid GSTIN format",
        },
      })}
      placeholder="33ABCDE1234F1Z5"
      maxLength={15}
      className="w-full border rounded-lg px-3 py-2"
    />

    {errors.gstin && (
      <p className="mt-1 text-sm text-red-500">
        {errors.gstin.message}
      </p>
    )}
  </div>

  <div>
    <label className="block mb-2 text-sm font-medium">
      PAN
    </label>

    <input
      {...register("pan", {
        pattern: {
          value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
          message: "Invalid PAN format",
        },
      })}
      placeholder="ABCDE1234F"
      maxLength={10}
      className="w-full border rounded-lg px-3 py-2 uppercase"
    />

    {errors.pan && (
      <p className="mt-1 text-sm text-red-500">
        {errors.pan.message}
      </p>
    )}
  </div>

</div>

      <div className="flex justify-end">

        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save"}
        </button>

      </div>

    </form>
  );
};

export default ShopTaxDetails;
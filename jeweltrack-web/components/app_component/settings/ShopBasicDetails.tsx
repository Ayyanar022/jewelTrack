"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

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
      queryClient.invalidateQueries({
        queryKey: ["shop-profile"],
      });
    },
  });

  const onSubmit = (values: ShopProfileForm) => {
    mutation.mutate(values);
  };

  if (isSubmitting) return <p>Loading...</p>;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl border mt-5 p-6 space-y-5"
    >
      <div className="grid md:grid-cols-2 gap-5">

        <div>
          <label className="text-sm font-medium">Shop Name</label>

          <input
            {...register("shop_name", {
              required: "Required",
            })}
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />

          <p className="text-red-500 text-sm">
            {errors.shop_name?.message}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">
            Owner Name
          </label>

          <input
            {...register("owner_name")}
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Phone
          </label>

          <input
            {...register("phone")}
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            WhatsApp
          </label>

          <input
            {...register("whatsapp")}
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            {...register("email")}
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>

      </div>

      <div>
        <label className="text-sm font-medium">
          Address
        </label>

        <textarea
          rows={4}
          {...register("address")}
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex justify-end">

        <button
          disabled={mutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          {mutation.isPending
            ? "Saving..."
            : data?.id
            ? "Update"
            : "Save"}
        </button>

      </div>

    </form>
  );
};

export default ShopBasicDetails;
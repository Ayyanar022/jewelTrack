"use client";

import Image from "next/image";
import api from "@/lib/axios";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const ShopBranding = ({ logo }: any) => {
  const queryClient = useQueryClient();
  const logoImg = logo ? `http://localhost:4000${logo}` : null;

  const [preview, setPreview] = useState<string | null>(logoImg);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post(
        "/settings/shop-profile/logo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    },

    onSuccess: () => {
      toast.success("Shop logo updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["shop-profile"],
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to upload logo");
    },
  });

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Size validation
    if (file.size > 2 * 1024 * 1024) {
      alert("Maximum image size is 2 MB");
      return;
    }

    // Type validation
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      alert("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    setPreview(URL.createObjectURL(file));

    mutation.mutate(file);
  };

  return (
    <div className="bg-white border rounded-xl mt-5 p-6">

      <h2 className="text-xl font-semibold mb-6">
        Shop Branding
      </h2>

      <div className="flex items-center gap-8">

        <div>

          {preview ? (
            <Image
              src={preview}
              alt="Logo"
              width={140}
              height={140}
              className="rounded-xl border object-cover"
            />
          ) : (
            <div className="w-[140px] h-[140px] border rounded-xl flex items-center justify-center text-gray-400">
              No Logo
            </div>
          )}

        </div>

        <div className="space-y-3">

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleImage}
          />

          <p className="text-sm text-gray-500">
            Supported formats:
            JPG, JPEG, PNG, WEBP
          </p>

          <p className="text-sm text-gray-500">
            Maximum size: 2 MB
          </p>

          {mutation.isPending && (
            <p className="text-blue-600">
              Uploading...
            </p>
          )}

        </div>

      </div>

    </div>
  );
};

export default ShopBranding;
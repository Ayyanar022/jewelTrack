"use client";

import Image from "next/image";
import api from "@/lib/axios";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const ShopBranding = ({ logo }: any) => {
  const queryClient = useQueryClient();
  const logoImg = logo ? `${API_BASE}${logo}` : null;

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

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maximum image size is 2 MB");
      return;
    }

    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    mutation.mutate(file);
  };

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-xl p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900">
            Showroom Logo & Branding
          </h2>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
        <div className="shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt="Logo"
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border border-slate-200 object-cover shadow-2xs"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-1">
              <ImageIcon className="w-5 h-5 opacity-40" />
              <span className="text-[10px] font-semibold">No Logo</span>
            </div>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <div>
            <label className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs h-7.5 sm:h-8 px-3 rounded-lg shadow-xs cursor-pointer transition-all">
              <Upload className="w-3 h-3" />
              <span>Choose Image</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImage}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-0.5 text-[10px] sm:text-[11px] text-slate-400">
            <p>Supported formats: JPG, PNG, WEBP (Max 2 MB)</p>
            <p>Printed on bill heads, estimation slips, and gold scheme passbooks.</p>
          </div>

          {mutation.isPending && (
            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold pt-0.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Uploading logo...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopBranding;
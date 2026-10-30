'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { UserPlus, Store, Phone, MapPin, Scale, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerToEdit?: any;
  onSuccess?: () => void;
}

export default function CreateDealerModal({ open, onOpenChange, dealerToEdit, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(dealerToEdit?.name || '');
  const [shopName, setShopName] = useState(dealerToEdit?.shop_name || '');
  const [phone, setPhone] = useState(dealerToEdit?.phone || '');
  const [address, setAddress] = useState(dealerToEdit?.address || '');
  const [city, setCity] = useState(dealerToEdit?.city || '');
  const [openingPureBalance, setOpeningPureBalance] = useState(
    dealerToEdit?.opening_pure_balance?.toString() || '0',
  );
  const [notes, setNotes] = useState(dealerToEdit?.notes || '');

  const isEditing = !!dealerToEdit;

  const { mutate: saveDealer, isPending } = useMutation({
    mutationFn: (data: any) =>
      isEditing ? api.patch(`/dealer/${dealerToEdit.id}`, data) : api.post('/dealer', data),
    onSuccess: () => {
      toast.success(isEditing ? 'Dealer updated successfully!' : 'New dealer added successfully!');
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save dealer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shopName.trim() || !phone.trim()) {
      toast.error('Please enter Name, Shop Name, and Phone Number');
      return;
    }

    saveDealer({
      name: name.trim(),
      shop_name: shopName.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      opening_pure_balance: Number(openingPureBalance) || 0,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[88dvh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-gold flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <span>{isEditing ? 'Edit Dealer / Peer Shop' : 'Add Partner Dealer'}</span>
            </DialogTitle>
          </DialogHeader>
        </div>

        <form id="create-dealer-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Contact / Owner Name *</Label>
              <Input
                placeholder="e.g. Senthil Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Shop / Business Name *</Label>
              <Input
                placeholder="e.g. Sri Murugan Jewellers"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="h-9 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Phone Number *</Label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 pl-9 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Town / City</Label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="e.g. Salem, Namakkal"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-9 pl-9 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Shop Address</Label>
            <Input
              placeholder="e.g. 14 Car Street, Bazaar"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-9 text-xs font-medium"
            />
          </div>

          {!isEditing && (
            <div className="space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-gold" />
                  <span>Opening Pure Gold Balance (சுத்த தங்க பாக்கி)</span>
                </Label>
                <span className="text-[11px] text-amber-800 font-semibold">Grams (g)</span>
              </div>
              <Input
                type="number"
                step="any"
                placeholder="0.000"
                value={openingPureBalance}
                onChange={(e) => setOpeningPureBalance(e.target.value)}
                className="h-9 text-xs font-bold bg-white"
              />
              <p className="text-[10px] text-amber-800/80">
                Enter existing pure gold weight (in grams) if this dealer already owes you metal before using JewelTrack.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700">Notes / Remarks</Label>
            <Input
              placeholder="e.g. Friday settlement party"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs font-medium"
            />
          </div>

        </form>

        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs font-bold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-dealer-form"
            disabled={isPending}
            className="h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer flex items-center gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save Changes' : 'Add Dealer'}</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

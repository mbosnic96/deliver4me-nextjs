"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string, otherPartyId: string) => void;
  session: { user: { id: string } } | null;
  loadData: {
    userId: string;        
    driverId?: string | null; 
    alreadyReviewed?: boolean;
  } | null;
}


export function ReviewDialog({
  isOpen,
  onClose,
  onSubmit,
  session,
  loadData,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);


  useEffect(() => {
    if (loadData?.alreadyReviewed) {
      setReviewSubmitted(true);
    }
  }, [loadData]);

  if (!session?.user?.id || !loadData) return null;


  const otherPartyId =
  loadData.userId === session.user.id
    ? loadData.driverId ?? null // review driver
    : loadData.userId;          // driver reviews load owner



  if (!otherPartyId || reviewSubmitted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#121212] text-white border border-gray-800">
        <DialogHeader>
          <DialogTitle>Ostavi recenziju</DialogTitle>
        </DialogHeader>

       
        <div className="flex space-x-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                size={28}
                className={star <= rating ? "text-yellow-400" : "text-gray-600"}
              />
            </button>
          ))}
        </div>

       
        <Textarea
          className="bg-[#1a1a1a] text-white border-gray-700 focus:ring focus:ring-primary"
          placeholder="Dodaj komentar (opcionalno)"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Zatvori
          </Button>
          <Button
            onClick={() => {
              onSubmit(rating, comment, otherPartyId);
              setReviewSubmitted(true);
              onClose();
            }}
            disabled={rating === 0}
          >
            Pošalji
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

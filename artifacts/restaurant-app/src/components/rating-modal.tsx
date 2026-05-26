import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useSubmitRating, useGetUserRating } from "@/lib/api-hooks";
import { toast } from "react-hot-toast";

interface RatingModalProps {
  itemId: number;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RatingModal({ itemId, itemName, isOpen, onClose }: RatingModalProps) {
  const { data: existingRating, isLoading: isLoadingExisting } = useGetUserRating(itemId, { enabled: isOpen });
  const submitRating = useSubmitRating();

  const [score, setScore] = useState(0);
  const [review, setReview] = useState("");
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  useEffect(() => {
    if (existingRating) {
      setScore(existingRating.score);
      setReview(existingRating.review || "");
    } else {
      setScore(0);
      setReview("");
    }
  }, [existingRating, isOpen]);

  const handleSubmit = async () => {
    if (score === 0) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await submitRating.mutateAsync({ itemId, score, review });
      toast.success("Rating submitted successfully");
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to submit rating";
      toast.error(detail);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {itemName}</DialogTitle>
          <DialogDescription>
            Share your experience with this item. Only verified buyers can rate.
          </DialogDescription>
        </DialogHeader>

        {isLoadingExisting ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="p-1 transition-transform hover:scale-110"
                    onMouseEnter={() => setHoveredScore(s)}
                    onMouseLeave={() => setHoveredScore(null)}
                    onClick={() => setScore(s)}
                  >
                    <Star
                      className={`w-10 h-10 ${
                        (hoveredScore !== null ? s <= hoveredScore : s <= score)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium h-5">
                {score === 0 && "Select a rating"}
                {score === 1 && "Poor"}
                {score === 2 && "Fair"}
                {score === 3 && "Good"}
                {score === 4 && "Very Good"}
                {score === 5 && "Excellent"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Review (optional)</p>
              <Textarea
                placeholder="What did you like or dislike?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="resize-none h-24"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitRating.isPending || isLoadingExisting || score === 0} 
            className="flex-1"
          >
            {submitRating.isPending ? "Submitting..." : (existingRating ? "Update Rating" : "Submit Rating")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

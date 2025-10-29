"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddFundsDialogProps {
    cards: { last4: string; brand: string }[];
    onAddFunds: (amount: number, cardIndex: number) => Promise<void>;
}

export function AddFundsDialog({ cards, onAddFunds }: AddFundsDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [selectedCard, setSelectedCard] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(parseFloat(amount))) return;
        setLoading(true);
        try {
            await onAddFunds(parseFloat(amount), selectedCard);
            setAmount("");
            setSelectedCard(0);
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white text-blue-600 hover:bg-blue-50">Dodaj sredstva</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Dodaj sredstva</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Količina</Label>
                        <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="Unesite iznos"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Odaberite karticz</Label>
                        <Select
                            value={selectedCard.toString()}
                            onValueChange={(v) => setSelectedCard(parseInt(v))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a card" />
                            </SelectTrigger>
                            <SelectContent>
                                {cards.map((card, idx) => (
                                    <SelectItem key={idx} value={idx.toString()}>
                                        {card.brand} **** {card.last4}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Dodavanje..." : "Dodaj sredstva"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Calendar, Lock, User } from "lucide-react";
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";

interface AddCardDialogProps {
    onAddCard: (cardData: {
        cardNumber: string;
        holderName: string;
        expiry: string;
        cvv: string;
        brand: string;
    }) => Promise<void>;
}

export function AddCardDialog({ onAddCard }: AddCardDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: "",
        holderName: "",
        expiry: "",
        cvv: "",
    });

    const detectBrand = (cardNumber: string): string => {
        const firstDigit = cardNumber.charAt(0);
        const firstTwoDigits = cardNumber.slice(0, 2);

        if (/^4/.test(cardNumber)) return "Visa";
        if (/^5[1-5]/.test(cardNumber)) return "Mastercard";
        if (/^3[47]/.test(cardNumber)) return "American Express";
        if (/^6(?:011|5)/.test(cardNumber)) return "Discover";
        return "Unknown";
    };

    const formatCardNumber = (value: string): string => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        return parts.length ? parts.join(' ') : value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const cardData = {
                cardNumber: formData.cardNumber.replace(/\s/g, ''),
                holderName: formData.holderName,
                expiry: formData.expiry,
                cvv: formData.cvv,
                brand: detectBrand(formData.cardNumber),
            };

            await onAddCard(cardData);
            setOpen(false);
            setFormData({ cardNumber: "", holderName: "", expiry: "", cvv: "" });
        } catch (error) {
            console.error("Error adding card:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Add Card
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Card</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <CreditCard className="h-8 w-8" />
                                <span className="text-sm font-semibold">
                                    {detectBrand(formData.cardNumber) || "CARD"}
                                </span>
                            </div>

                            <div className="mb-4">
                                <div className="text-xl font-mono tracking-wider">
                                    {formData.cardNumber || "•••• •••• •••• ••••"}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xs opacity-80">Card Holder</div>
                                    <div className="text-sm font-medium">
                                        {formData.holderName || "YOUR NAME"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs opacity-80">Expires</div>
                                    <div className="text-sm font-medium">
                                        {formData.expiry || "MM/YY"}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                                id="cardNumber"
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                value={formData.cardNumber}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    cardNumber: formatCardNumber(e.target.value)
                                })}
                                maxLength={19}
                                required
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="holderName">Card Holder Name</Label>
                            <Input
                                id="holderName"
                                type="text"
                                placeholder="John Doe"
                                value={formData.holderName}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    holderName: e.target.value.toUpperCase()
                                })}
                                required
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Datetime
                                    dateFormat="MM/YY"
                                    timeFormat={false}
                                    onChange={(value: string | moment.Moment) => {
                                        let formatted = "";
                                        if (value && typeof value === "object" && "format" in value) {
                                            formatted = value.format("MM/YY");
                                        } else if (typeof value === "string") {
                                            formatted = value;
                                        }
                                        setFormData({
                                            ...formData,
                                            expiry: formatted
                                        });
                                    }}
                                    renderInput={(props) => (
                                        <Input
                                            {...props}
                                            id="expiry"
                                            placeholder="MM/YY"
                                            value={formData.expiry}
                                            className="mt-1"
                                            required
                                        />
                                    )}
                                />

                            </div>

                            <div>
                                <Label htmlFor="cvv">CVV</Label>
                                <Input
                                    id="cvv"
                                    type="password"
                                    placeholder="123"
                                    value={formData.cvv}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        cvv: e.target.value.replace(/[^0-9]/g, '')
                                    })}
                                    maxLength={4}
                                    required
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Adding Card..." : "Add Card"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
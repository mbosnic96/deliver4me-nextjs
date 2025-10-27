import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Wallet, { WalletCard } from "@/lib/models/Wallet";
import { dbConnect } from "@/lib/db/db";

import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY || '6a5c18293a1c4efd3f0f23168dc5ef606002398634945beb99bbbcaede0e07f8'; //hardcod da ne morate sve buildati

function encryptCardData(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

function decryptCardData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

export async function GET(req: NextRequest) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let wallet = await Wallet.findOne({ userId: session.user.id });
    if (!wallet) {
        wallet = await Wallet.create({ userId: session.user.id, balance: 0, cards: [], transactions: [], escrow: 0 });
    }

    const displaySafeCards = wallet.cards.map((card: any) => ({
        brand: card.brand,
        last4: card.last4,
        holderName: card.holderName ? decryptCardData(card.holderName) : card.displayName,
        expiry: card.expiry ? decryptCardData(card.expiry) : card.displayExpiry,
    }));



    const plainWallet = {
        ...wallet.toObject(),
        cards: displaySafeCards,
        transactions: wallet.transactions?.sort(
            (a: { createdAt: Date }, b: { createdAt: Date }) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) || [],
        escrow: wallet.escrow || 0,
    };

    return NextResponse.json(plainWallet);
}


export async function POST(req: NextRequest) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, data } = await req.json();
    let wallet = await Wallet.findOne({ userId: session.user.id });

    if (!wallet) wallet = await Wallet.create({ userId: session.user.id, balance: 0, cards: [], transactions: [] });


    if (action === "addCard") {
        const rawNumber = data.cardNumber.replace(/\s/g, '');
        const encryptedCard = {
            cardNumber: encryptCardData(rawNumber),
            holderName: encryptCardData(data.holderName),
            expiry: encryptCardData(data.expiry),
            cvv: encryptCardData(data.cvv),
            brand: data.brand,
            last4: rawNumber.slice(-4),
            displayName: data.holderName
                .split(" ")
                .map((name: string, i: number, arr: string[]) =>
                    i === 0 || i === arr.length - 1 ? name : name[0] + "."
                )
                .join(" "),
        };
        wallet.cards.push(encryptedCard);
    }


    if (action === "addFunds") {
        const { amount, cardIndex } = data;

        if (amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        let cardLast4: string | undefined;

        if (typeof cardIndex === "number") {
            const selectedCard = wallet.cards[cardIndex];
            if (!selectedCard) {
                return NextResponse.json({ error: "Selected card not found" }, { status: 404 });
            }

            cardLast4 = selectedCard.last4 || decryptCardData(selectedCard.cardNumber).slice(-4);

            //ovdje se poziva api za uplate, za dev samo simulacija
        }

        wallet.balance += amount;
        wallet.transactions.push({
            amount,
            type: "credit",
            description: cardLast4
                ? `Funds added from card ending ${cardLast4}`
                : "Funds added",
            createdAt: new Date(),
        });
    }


    if (action === "deleteCard") {
        wallet.cards = wallet.cards.filter((_: any, index: number) => index !== data.cardIndex);
    }

    if (action === "payout") {
        const { amount, cardIndex } = data;

        const selectedCard = wallet.cards[cardIndex];
        if (!selectedCard) {
            return NextResponse.json({ error: "Selected card not found" }, { status: 404 });
        }

        const cardLast4 =
            selectedCard.last4 ||
            decryptCardData(selectedCard.cardNumber).slice(-4);

        //ovdje se poziva api za isplate, za dev samo simulacija

        wallet.balance -= amount;
        wallet.transactions.push({
            amount: -amount,
            type: "debit",
            description: `Payout of $${amount} to card ending ${cardLast4}`,
            createdAt: new Date(),
        });
    }



    await wallet.save();

    const plainWallet = {
        ...wallet.toObject(),
        cards: wallet.cards || [],
        transactions: wallet.transactions || [],
        escrow: wallet.escrow || 0,
    };

    return NextResponse.json(plainWallet);
}

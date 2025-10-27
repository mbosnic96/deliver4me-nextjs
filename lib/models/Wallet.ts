import mongoose, { Schema, Document, models, model } from "mongoose";

export interface WalletCard {
  cardNumber: string;    
  holderName: string;   
  expiry: string;       
  cvv?: string;          
  last4: string;         
  displayName: string;   
  displayExpiry?: string;
  brand: string;
}

// Wallet interface
export interface IWallet extends Document {
  userId: string;
  balance: number;
  escrow: number;
  cards: WalletCard[];
  transactions: {
    amount: number;
    type: "credit" | "debit" | "escrow_deposit" | "escrow_release" | "escrow_refund" | "escrow_pending" | "escrow_cancel";
    description: string;
    createdAt: Date;
  }[];
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    escrow: { type: Number, default: 0 },
    cards: {
      type: [
        {
          cardNumber: String,
          holderName: String,
          expiry: String,
          cvv: String,
          brand: String,
          last4: String,
          displayName: String,
          displayExpiry: String,
        },
      ],
      default: [],
    },
    transactions: {
      type: [
        {
          amount: Number,
          type: { 
            type: String, 
            enum: [
              "credit", 
              "debit", 
              "escrow_deposit", 
              "escrow_release", 
              "escrow_refund", 
              "escrow_pending", 
              "escrow_cancel"
            ] 
          },
          description: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default models.Wallet || model<IWallet>("Wallet", WalletSchema);
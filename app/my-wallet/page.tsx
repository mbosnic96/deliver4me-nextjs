"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table } from "@/components/Table";
import { AddCardDialog } from "@/components/AddCardDialog";
import { CardItem } from "@/components/CardItem";
import { useSession } from "next-auth/react";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Plus,
  History
} from "lucide-react";
import { toast } from "react-toastify";

import { AddFundsDialog } from "@/components/AddFundsDialog";
import { RequestPayoutDialog } from "@/components/ReqestPayoutDialog";
type Role = 'client' | 'driver' | 'admin' | undefined
type Wallet = {
  _id: string;
  balance: number;
  escrow: number;
  cards: { 
    last4: string; 
    holderName: string; 
    expiry: string; 
    brand: string;
    cvv: string;
  }[];
  transactions: { 
    _id: string;
    amount: number; 
    type: string; 
    description: string; 
    createdAt: string;
  }[];
};

export default function MyWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addingFunds, setAddingFunds] = useState(false);
  const [deletingCard, setDeletingCard] = useState<number | null>(null);
    const { data: session } = useSession()
  const role = session?.user?.role as Role
  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const json = await res.json();
        setWallet(json);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
      toast.error("Neuspješno učitavanje novčanika");
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

const handleAddFunds = async (amount: number, cardIndex?: number) => {
  setAddingFunds(true);
  try {
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "addFunds", 
        data: { amount, cardIndex } 
      }),
    });

    if (res.ok) {
      toast.success("Sredstva uspješno dodana!");
      fetchWallet();
    } else {
      throw new Error("Failed to add funds");
    }
  } catch (error) {
    console.error("Error adding funds:", error);
    toast.error("Neuspješno dodavanje sredstava");
  } finally {
    setAddingFunds(false);
  }
};


  const handleAddCard = async (cardData: any) => {
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "addCard", 
          data: cardData 
        }),
      });
      
      if (res.ok) {
        toast.success("Uspješno dodavanje kartice!");
        fetchWallet();
      } else {
        throw new Error("Neuspješno dodavanje kartice");
      }
    } catch (error) {
      console.error("Error adding card:", error);
      toast.error("Neuspješno dodavanje kartice");
      throw error;
    }
  };

  const handleDeleteCard = async (cardIndex: number) => {
    setDeletingCard(cardIndex);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "deleteCard", 
          data: { cardIndex } 
        }),
      });
      
      if (res.ok) {
        toast.success("Uspješno obrisana kartica!");
        fetchWallet();
      } else {
        throw new Error("Neuspješno brisanje kartice");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Neuspješno brisanje kartice");
    } finally {
      setDeletingCard(null);
    }
  };

  const handlePayout = async (amount: number, cardIndex: number) => {
  try {
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "payout", 
        data: { amount, cardIndex } 
      }),
    });

    if (res.ok) {
      toast.success("Payout successful!");
      fetchWallet();
    } else {
      const error = await res.json();
      toast.error(error.error || "Neuspješna isplata");
    }
  } catch (error) {
    console.error("Error during payout:", error);
    toast.error("Neuspješna isplata");
  }
};



  return (
        <div className="min-h-screen">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

  <main 
        className={`flex-1 transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
      <div className="p-4 md:p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Novčanik              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Upravljajte sredstvima i metodama plaćanja
              </p>
            </div>
          </div>

          {wallet ? (
            <div className="space-y-8">
              <RequestPayoutDialog cards={wallet.cards} onPayout={handlePayout} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Dostupna sredstva</p>
                        <p className="text-3xl font-bold mt-1">
                          {wallet.balance.toFixed(2)} BAM
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 opacity-90" />
                    </div>
                    <AddFundsDialog cards={wallet.cards} onAddFunds={handleAddFunds} />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Rezervisana sredstva</p>
                        <p className="text-3xl font-bold mt-1">
                          {wallet.escrow.toFixed(2)} BAM
                        </p>
                        <p className="text-xs opacity-80 mt-1">
                          Sredstva rezervisana za tekuće isporuke
                        </p>
                      </div>
                      <Shield className="h-12 w-12 opacity-90" />
                    </div>
                  </CardContent>
                </Card>
              </div>

             

              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Metode plaćanja
                    </h3>
                    <AddCardDialog onAddCard={handleAddCard} />
                  </div>
                  
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {wallet.cards.map((card, index) => (
                      <div key={index} className="group relative">
                        <CardItem
                          card={card}
                          onDelete={() => handleDeleteCard(index)}
                          loading={deletingCard === index}
                        />
                      </div>
                    ))}
                    
                    {wallet.cards.length === 0 && (
                      <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nema dodanih metoda plaćanja</p>
                        <p className="text-sm mt-1">Dodajte svoju karticu</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6  max-h-62 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Historija transakcija
                  </h3>
                  
                  {wallet.transactions.length > 0 ? (
                    <div className="space-y-3">
                      {wallet.transactions.map((transaction) => (
                        <div
                          key={transaction._id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.type === "credit" 
                                ? "text-green-600" 
                                : "text-red-600"
                            }`}>
                              {transaction.type === "credit" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {transaction.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nema transakcija</p>
                      <p className="text-sm mt-1">Historija transakcija će se prikazati ovdje</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Flag, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { createNotification } from '@/lib/notifications';

interface ReportDialogProps {
  reportedUserId: string;
  reportedUserName: string;
  loadId?: string;
  loadTitle?: string;
  trigger?: React.ReactNode;
}

const reportTypes = [
  { value: "spam", label: "Spam ili lažni oglas", description: " - Nevažeći ili obmanjujući sadržaj" },
  { value: "inappropriate_content", label: "Neprikladan sadržaj", description: " - Uvredljiv, neprimjeren ili štetni sadržaj" },
  { value: "fraud", label: "Prevara ili prevara", description: " - Pokušaj prevare ili obmanjivanja" },
  { value: "harassment", label: "Uznemiravanje", description: " - Neželjeni kontakt ili uznemiravanje" },
  { value: "fake_profile", label: "Lažni profil", description: " - Profil koji se predstavlja lažno" },
  { value: "other", label: "Ostalo", description: " - Neki drugi razlog" },
];

export function ReportDialog({
  reportedUserId,
  reportedUserName,
  loadId,
  loadTitle,
  trigger
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType || !description.trim()) {
      toast.error("Molimo odaberite vrstu prijave i navedite detalje");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Molimo opišite problem detaljnije (najmanje 10 karaktera)");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId, loadId, reportType, description: description.trim() }),
      });

      if (!response.ok) throw new Error("Failed to submit report");

      const newReport = await response.json();

      // Notify admins
      try {
        const adminsRes = await fetch('/api/users?role=admin');
        const result = await adminsRes.json();
        const admins = result.data;
        if (Array.isArray(admins)) {
          for (const admin of admins) {
            await createNotification(
              admin._id,
              `Nova prijava od korisnika ${session?.user.name} (${reportType})`,
              `/reports/${newReport._id}`
            );
          }
        }
      } catch (err) {
        console.error("Failed to notify admins:", err);
      }

      setIsSubmitted(true);
      toast.success("Prijava je uspješno poslana!");

      setTimeout(() => {
        setOpen(false);
        setIsSubmitted(false);
        setReportType("");
        setDescription("");
      }, 2000);

    } catch (error) {
      console.error("Report submission error:", error);
      toast.error("Došlo je do greške pri slanju prijave");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) return;
    setOpen(open);
    if (!open) {
      setTimeout(() => {
        setIsSubmitted(false);
        setReportType("");
        setDescription("");
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Prijavi
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <DialogTitle className="text-lg">Prijava Poslana</DialogTitle>
            <DialogDescription className="mt-2">
              Hvala vam što ste prijavili problem. Naš tim će pregledati vašu prijavu i poduzeti odgovarajuće mjere.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Prijavi Korisnika
              </DialogTitle>
              <DialogDescription>
                Prijavljujete korisnika {reportedUserName}{loadTitle && ` za teret "${loadTitle}"`}. Molimo opišite problem detaljno.
              </DialogDescription>
            </DialogHeader>

            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sve prijave su anonimne. Korisnik neće znati ko ga je prijavio.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="reportType">Vrsta Prijave</Label>
                <RadioGroup value={reportType} onValueChange={setReportType}>
                  {reportTypes.map((type) => (
                    <div key={type.value} className="flex items-start space-x-2">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label htmlFor={type.value} className="font-normal cursor-pointer">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Opis Problema {description.trim().length > 0 && `(${description.trim().length}/1000)`}
                </Label>
                <Textarea
                  id="description"
                  placeholder="Molimo opišite problem što je detaljnije moguće."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  disabled={isSubmitting}
                />
                <div className="text-xs text-muted-foreground">
                  Minimalno 10 karaktera. Maksimalno 1000 karaktera.
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="flex-1">Otkaži</Button>
                <Button type="submit" disabled={!reportType || !description.trim() || description.trim().length < 10 || isSubmitting} className="flex-1">
                  {isSubmitting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Šaljem...</>) : "Pošalji Prijavu"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

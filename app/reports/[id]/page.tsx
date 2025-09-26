"use client";

import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Flag, 
  User, 
  Calendar, 
  Truck, 
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

type Report = {
  _id: string;
  reporterId: {
    _id: string;
    name: string;
    userName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  reportedUserId: {
    _id: string;
    name: string;
    userName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  loadId?: {
    _id: string;
    title: string;
    description: string;
  };
  reportType: string;
  description: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  adminNotes?: string;
  evidence: string[];
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: {
    name: string;
    userName: string;
  };
};

export default function ReportDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const reportId = params.id as string;
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error("Failed to fetch report");
      const data = await response.json();
      setReport(data);
      setStatus(data.status);
      setAdminNotes(data.adminNotes || "");
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Greška pri učitavanju prijave");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to update report");

      const updatedReport = await response.json();
      setReport(updatedReport);
      toast.success("Prijava uspješno ažurirana");
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Greška pri ažuriranju prijave");
    } finally {
      setSaving(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      spam: "Spam ili lažni oglas",
      inappropriate_content: "Neprikladan sadržaj",
      fraud: "Prevara ili prevara",
      harassment: "Uznemiravanje",
      fake_profile: "Lažni profil",
      other: "Ostalo"
    };
    return typeLabels[type] || type;
  };

  const getStatusConfig = (status: string) => {
    const config = {
      pending: { label: "Na čekanju", color: "bg-yellow-100 text-yellow-800" },
      under_review: { label: "U pregledu", color: "bg-blue-100 text-blue-800" },
      resolved: { label: "Riješeno", color: "bg-green-100 text-green-800" },
      dismissed: { label: "Odbijeno", color: "bg-red-100 text-red-800" }
    };
    return config[status as keyof typeof config] || config.pending;
  };

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Pristup odbijen</h2>
          <p className="text-gray-600">Nemate potrebne dozvole za pristup ovoj stranici.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Prijava nije pronađena</h2>
          <p className="text-gray-600">Tražena prijava ne postoji ili je obrisana.</p>
          <Link href="/admin/reports" className="text-blue-600 underline mt-4 inline-block">
            ← Nazad na listu prijava
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(report.status);

  return (
<div className="flex min-h-screen">
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
          <Link href="/reports" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Nazad na listu prijava
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Detalji prijave</h1>
              <p className="text-gray-600">ID: {report._id}</p>
            </div>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flag className="h-5 w-5 mr-2 text-orange-500" />
                  Informacije o prijavi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tip prijave</Label>
                    <p className="font-semibold">{getReportTypeLabel(report.reportType)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Datum prijave</Label>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {new Date(report.createdAt).toLocaleString('bs-BA')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Opis problema</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="whitespace-pre-wrap">{report.description}</p>
                  </div>
                </div>

                {report.evidence.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Dokazi ({report.evidence.length})</Label>
                    <div className="mt-2 space-y-2">
                      {report.evidence.map((evidence, index) => (
                        <a
                          key={index}
                          href={evidence}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Dokaz {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {report.loadId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-blue-500" />
                    Informacije o teretu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Naslov:</strong> {report.loadId.title}</p>
                    <p><strong>Opis:</strong> {report.loadId.description}</p>
                    <Link 
                      href={`/load/${report.loadId._id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      target="_blank"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Pogledaj teret
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upravljanje prijavom</CardTitle>
                <CardDescription>Ažurirajte status i dodajte bilješke</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Na čekanju</SelectItem>
                      <SelectItem value="under_review">U pregledu</SelectItem>
                      <SelectItem value="resolved">Riješeno</SelectItem>
                      <SelectItem value="dismissed">Odbijeno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="adminNotes">Admin bilješke</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Dodajte bilješke o prijavi..."
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Spremanje...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Spremi promjene
                    </>
                  )}
                </Button>

                {report.resolvedAt && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <strong>Riješeno:</strong> {new Date(report.resolvedAt).toLocaleString('bs-BA')}
                      {report.resolvedBy && ` • od ${report.resolvedBy.name}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-500" />
                  Korisnik koji je prijavio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Ime:</strong> {report.reporterId.name}</p>
                <p><strong>Korisničko ime:</strong> @{report.reporterId.userName}</p>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {report.reporterId.email}
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {report.reporterId.phone}
                </p>
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {report.reporterId.address}, {report.reporterId.city}, {report.reporterId.country}
                </p>
                <Link 
                  href={`/users/${report.reporterId._id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  target="_blank"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Pogledaj profil
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-red-500" />
                  Prijavljeni korisnik
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Ime:</strong> {report.reportedUserId.name}</p>
                <p><strong>Korisničko ime:</strong> @{report.reportedUserId.userName}</p>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {report.reportedUserId.email}
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {report.reportedUserId.phone}
                </p>
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {report.reportedUserId.address}, {report.reportedUserId.city}, {report.reportedUserId.country}
                </p>
                <Link 
                  href={`/users/${report.reportedUserId._id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  target="_blank"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Pogledaj profil
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

interface Terms {
  title: string;
  content: string;
  updatedAt: string;
}

export default function TermsPage() {
  const [terms, setTerms] = useState<Terms | null>(null);

  useEffect(() => {
    fetch("/api/terms")
      .then((res) => res.json())
      .then((data) => setTerms(data));
  }, []);

  if (!terms) return <p className="p-4">Učitavanje...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">{terms.title}</h1>
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: terms.content }}
      />
      <p className="text-sm text-gray-500 mt-4">
        Ažurirano: {new Date(terms.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}

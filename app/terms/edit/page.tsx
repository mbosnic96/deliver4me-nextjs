"use client";

import { useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-toastify";

export default function EditTermsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/terms")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setTitle(data.title);
          setContent(data.content);
        }
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/terms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    setLoading(false);

    if (res.ok) {
      toast.success("Pravila korištenja ažurirana!");
    } else {
      toast.error("Neuspješno ažuriranje pravila korištenja");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Pravila korištenja</h1>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 p-2 rounded mb-4"
        placeholder="Naziv"
      />

      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"  
        value={content}
        onEditorChange={(val) => setContent(val)}
        init={{
          height: 500,
          menubar: true,
          plugins: "link lists code table",
          toolbar:
            "undo redo | formatselect | bold italic underline | bullist numlist | link | code",
          skin: "oxide",
          content_css: "default",
        }}
      />

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Spremanje..." : "Sačuvaj"}
      </button>
    </div>
  );
}

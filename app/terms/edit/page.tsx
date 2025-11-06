"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="border border-gray-300 rounded p-4 h-[500px] flex items-center justify-center">
        Učitavanje editora...
      </div>
    ),
  }
);

export default function EditTermsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/terms")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setTitle(data.title || "");
          setContent(data.content || "");
        }
      })
      .catch(() => toast.error("Neuspješno učitavanje podataka"));
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
      toast.success("Pravila korištenja su ažurirana!");
    } else {
      toast.error("Greška pri ažuriranju pravila korištenja");
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
        className={`transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <div className="p-4 md:p-8 flex flex-col h-full">
          <div className="content-bg shadow-sm rounded-lg p-6">
            <h1 className="text-3xl font-semibold mb-6">
              Uredi Pravila Korištenja
            </h1>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mb-4"
              placeholder="Naziv dokumenta"
            />

            {mounted && (
              <Editor
                onInit={(_, editor) => (editorRef.current = editor)}
                value={content}
                onEditorChange={(val) => setContent(val)}
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                init={{
                  height: 500,
                  menubar: true,
                  plugins:
                    "advlist autolink lists link image charmap preview anchor " +
                    "searchreplace visualblocks code fullscreen " +
                    "insertdatetime media table code help wordcount",
                  toolbar:
                    "undo redo | formatselect | bold italic underline | " +
                    "alignleft aligncenter alignright alignjustify | " +
                    "bullist numlist outdent indent | removeformat | help",
                  skin_url: "/tinymce/skins/ui/oxide",
                  content_css: "/tinymce/skins/content/default/content.css",
                }}
              />
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Spremanje..." : "Sačuvaj"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

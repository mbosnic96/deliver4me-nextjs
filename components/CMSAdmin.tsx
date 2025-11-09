"use client";

import { useState, useEffect, ReactNode } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, GripVertical, Edit, Trash2, Eye, EyeOff, Save, X, Upload, Image, FileText, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { CMSContent, ContentType, UploadedFile } from '@/lib/types/cms';
import Swal from 'sweetalert2';
import Sidebar from "@/components/Sidebar";
import { useSession } from "next-auth/react";

interface SortableItemProps {
  id: string;
  children: ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="p-4 rounded-lg border mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors">
            <GripVertical size={20} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function FileManager({ onSelectImage, isOpen, onClose }: { 
  onSelectImage: (url: string) => void; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadFiles = async () => {
    try {
      const res = await fetch('/api/cms/upload');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else {
        toast.error('Failed to load files');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Error loading files');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/cms/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newFile = await res.json();
        setFiles(prev => [newFile, ...prev]);
        toast.success('File uploaded successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };


const handleDeleteFile = async (filename: string) => {
  const result = await Swal.fire({
    title: 'Jeste li sigurni?',
    text: "Želite li zaista obrisati ovu datoteku? Ova radnja se ne može poništiti!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Da, obriši!',
    cancelButtonText: 'Otkaži',
    reverseButtons: true,
    customClass: {
      confirmButton: 'swal2-confirm',
      cancelButton: 'swal2-cancel',
     popup: 'pointer-events-auto'
    }
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/api/cms/upload?filename=${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setFiles(prev => prev.filter(f => f.filename !== filename));
      if (selectedFile === `/uploads/${filename}`) {
        setSelectedFile(null);
      }
      
      // Success message in Bosnian
      await Swal.fire({
        title: 'Obrisano!',
        text: 'Datoteka je uspješno obrisana.',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'U redu',
        timer: 3000,
        timerProgressBar: true,
         customClass: { popup: 'pointer-events-auto' }
      });
    } else {
      // Error message in Bosnian
      await Swal.fire({
        title: 'Greška!',
        text: 'Brisanje datoteke nije uspjelo. Pokušajte ponovo.',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'U redu',
         customClass: { popup: 'pointer-events-auto' }
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    
    // Network error message in Bosnian
    await Swal.fire({
      title: 'Greška!',
      text: 'Došlo je do greške prilikom brisanja. Provjerite vezu i pokušajte ponovo.',
      icon: 'error',
      confirmButtonColor: '#d33',
      confirmButtonText: 'U redu',
       customClass: { popup: 'pointer-events-auto' }
    });
  }
};

  const handleSelect = () => {
    if (selectedFile) {
      onSelectImage(selectedFile);
      onClose();
    }
  };

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>File Manager</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="library" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Biblioteka</TabsTrigger>
            <TabsTrigger value="upload">Uploaduj fajl</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="flex-1">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-full flex items-center justify-center">
              <div className="w-full">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="flex flex-col items-center gap-4">
                    <Upload className="w-16 h-16 text-gray-400" />
                    <div>
                      <span className="text-lg font-medium block">
                        {isUploading ? 'Uploadovanje...' : 'Kliknite da odaberete fajl ili prevucite isti'}
                      </span>
                      <span className="text-sm text-gray-500 block mt-1">
                        PNG, JPG, GIF, WEBP
                      </span>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="library" className="flex-1 flex flex-col">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={loadFiles}>
                Osvježi
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto flex-1">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-all group ${
                    selectedFile === file.url ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedFile(file.url)}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {file.mimetype.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.filename);
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredFiles.length === 0 && (
              <div className="text-center py-12 text-gray-500 flex-1 flex items-center justify-center">
                <div>
                  <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nema fotografija</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try a different search term' : 'Upload your first file to get started'}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className='mt-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'>Cancel</Button>
          <Button onClick={handleSelect} disabled={!selectedFile} className='mt-1 bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'>
            Odaberi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ImageField({ 
  value, 
  onChange, 
  label,
  onOpenFileManager 
}: { 
  value: string; 
  onChange: (value: string) => void;
  label: string;
  onOpenFileManager: (setter: (url: string) => void) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or select from library"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenFileManager(onChange)}
        >
          <Image size={16} />
        </Button>
      </div>
      {value && (
        <div className="mt-2">
          <img 
            src={value} 
            alt="Preview" 
            className="h-32 object-cover rounded border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function CMSAdmin() {
  const [contents, setContents] = useState<CMSContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingContent, setEditingContent] = useState<CMSContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [fileManagerOpen, setFileManagerOpen] = useState<boolean>(false);
  const [currentImageField, setCurrentImageField] = useState<{ setter: (url: string) => void } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: session } = useSession();
  const role = session?.user?.role as "client" | "driver" | "admin" | undefined;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { 
    fetchContents(); 
  }, []);

  const fetchContents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cms/content');
      if (!res.ok) throw new Error('Failed to load content');
      const data = await res.json();
      setContents(data);
    } catch (error) {
      toast.error('Error loading CMS data');
      console.error('Fetch error:', error);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = contents.findIndex((item) => item._id === active.id);
    const newIndex = contents.findIndex((item) => item._id === over.id);
    
    const newContents = arrayMove(contents, oldIndex, newIndex);
    const reorderedContents = newContents.map((item, index) => ({
      ...item,
      order: index
    }));

    setContents(reorderedContents);

    try {
      const res = await fetch('/api/cms/content/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: reorderedContents.map((item, index) => ({ 
            id: item._id, 
            order: index 
          })) 
        }),
      });

      if (!res.ok) throw new Error('Reorder failed');
      toast.success('Raspored uspješno ažuriran!');
    } catch (error) {
      toast.error('Greška pri ažuriranju sadržaja');
      setContents(contents);
    }
  };

  const handleSave = async (data: Partial<CMSContent>, isEdit = false) => {
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/cms/content/${data._id}` : '/api/cms/content';
      
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Save failed');
      }

      toast.success(`${isEdit ? 'Ažurirano' : 'Sačuvano'} uspješno!`);
      fetchContents();
      setIsDialogOpen(false);
      setIsCreateDialogOpen(false);
      setEditingContent(null);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Greška');
    }
  };

const handleDelete = async (id: string) => {
  const result = await Swal.fire({
    title: 'Jeste li sigurni?',
    text: 'Ova radnja se ne može poništti.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Da!',
    cancelButtonText: 'Otkaži',
    reverseButtons: true,
     customClass: { popup: 'pointer-events-auto' }
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/api/cms/content/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');

    setContents(prev => prev.filter(item => item._id !== id));

    await Swal.fire({
      icon: 'success',
      title: 'Obrisano!',
      text: 'Uspješno ste obrisali sadržaj.',
      timer: 1500,
      showConfirmButton: false,
       customClass: { popup: 'pointer-events-auto' }
    });

    toast.success('Uspješno ste obrisali sadržaj!');
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Greška pri brisanju sadržaja. Pokušajte ponovo.',
       customClass: { popup: 'pointer-events-auto' }
    });
    toast.error('Greška pri brisanju sadržaja. Pokušajte ponovo.');
  }
};


  const toggleActive = async (content: CMSContent) => {
    try {
      const res = await fetch(`/api/cms/content/${content._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...content, isActive: !content.isActive }),
      });

      if (!res.ok) throw new Error('Error updating status');
      
      const updated = await res.json();
      setContents(prev => prev.map(item => item._id === updated._id ? updated : item));
      toast.success('Status ažuriran!');
    } catch (error) {
      toast.error('Greška pri ažuriranju statusa');
    }
  };

  const openFileManager = (setter: (url: string) => void) => {
    setCurrentImageField({ setter });
    setFileManagerOpen(true);
  };

  const handleSelectImage = (url: string) => {
    if (currentImageField) {
      currentImageField.setter(url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
        <div className="py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Upravljajte sadržajem</h1>
              <p className="text-white">Upravljajte sadržajem i sekcijama</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Akcije</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full justify-start"
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Nova sekcija
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => openFileManager(() => {})}
                    >
                      <Image size={16} className="mr-2" />
                      File Manager
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistika</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ukupno sekcija</span>
                        <span className="font-semibold">{contents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aktivne</span>
                        <span className="font-semibold text-green-600">
                          {contents.filter(c => c.isActive).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Neaktivne</span>
                        <span className="font-semibold text-gray-600">
                          {contents.filter(c => !c.isActive).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Website Sections</CardTitle>
                    <p className="text-sm text-gray-600">Prevucite da uredite pozicije. Promjene se spremaju automatski</p>
                  </CardHeader>
                  <CardContent>
                  <DndContext 
  sensors={sensors} 
  collisionDetection={closestCenter} 
  onDragEnd={handleDragEnd}
>
  <SortableContext 
    items={contents.map(c => c._id)} 
    strategy={verticalListSortingStrategy}
  >
    <div className="space-y-3">
      {contents.map((content) => (
        <SortableItem key={content._id} id={content._id}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 p-3 rounded-lg bg-slate-800/30">
            <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
              <div className={`w-3 h-3 rounded-full ${content.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                    {content.type}
                  </span>
                  <h3 className="font-semibold text-white truncate">
                    {content.title || `Untitled ${content.type}`}
                  </h3>
                </div>
                {content.subtitle && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-1">{content.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(content)}
                title={content.isActive ? 'Deactivate' : 'Activate'}
                className={content.isActive ? 'text-green-500' : 'text-gray-400'}
              >
                {content.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingContent(content);
                  setIsDialogOpen(true);
                }}
                title="Edit"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(content._id)}
                title="Delete"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </SortableItem>
      ))}
    </div>
  </SortableContext>
</DndContext>


                {contents.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema sekcija</h3>
                    <p className="text-gray-600 mb-4">Dodajte prvu sekciju</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Dodaj sekciju
                    </Button>
                  </div>
                )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-2xl">
                <CreateContentForm 
                  onSave={(data) => handleSave(data, false)} 
                  onCancel={() => setIsCreateDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {editingContent && (
                  <EditContentForm
                    content={editingContent}
                    onSave={(data) => handleSave(data, true)}
                    onCancel={() => {
                      setIsDialogOpen(false);
                      setEditingContent(null);
                    }}
                    onOpenFileManager={openFileManager}
                  />
                )}
              </DialogContent>
            </Dialog>

            <FileManager
              isOpen={fileManagerOpen}
              onClose={() => setFileManagerOpen(false)}
              onSelectImage={handleSelectImage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function CreateContentForm({ onSave, onCancel }: { 
  onSave: (data: Partial<CMSContent>) => void; 
  onCancel: () => void; 
}) {
  const [form, setForm] = useState<Partial<CMSContent>>({
    type: 'hero',
    title: '',
    subtitle: '',
    content: {},
    isActive: true,
    metadata: {}
  });

  const handleSubmit = () => {
    if (!form.type) {
      toast.error('Odaberite tip sekcije');
      return;
    }
    
    if (!form.title?.trim()) {
      toast.error('Unesite naziv');
      return;
    }
    
    const initializedForm = {
      ...form,
      content: getDefaultContent(form.type as ContentType)
    };
    
    onSave(initializedForm);
  };

  const getDefaultContent = (type: ContentType) => {
    switch (type) {
      case 'hero':
        return { ctaText: 'Prijavi se', ctaLink: '/login', backgroundImage: '' };
      case 'features':
        return { items: [
          { title: 'Stavka 1', description: 'Opis stavke 1', icon: 'Check' },
          { title: 'Stavka 2', description: 'Opis stavke 2', icon: 'Truck' },
          { title: 'Stavka 3', description: 'Opis stavke 3', icon: 'Box' },
        ] };
      case 'testimonials':
        return { items: [] };
      case 'stats':
        return { items: [
          { value: '1000', label: 'Dostavljenih paketa', suffix: '+' },
          { value: '240', label: 'Vozača', suffix: '+' },
          { value: '100', label: 'Klijenata', suffix: '+' },
          { value: '1250', label: 'Aktivnih tereta', suffix: '+' }
        ] };
      case 'about':
        return { description: 'O aplikaciji', image: '', buttonText: 'Registruj se', buttonLink: '/register' };
      case 'cta':
        return { buttonText: 'Prijavi se', buttonLink: '/login', secondaryButtonText: 'Registruj se', secondaryButtonLink: '/register' };
      case 'slider':
        return { slides: [], autoplay: true, interval: 5000 };
      case 'gallery':
        return { images: [], columns: 3 };
      case 'contact':
        return { email: '', phone: '', address: '', formFields: ['name', 'email', 'message'] };
      default:
        return {};
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova sekcija</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="type">Tip sadržaja *</Label>
          <Select value={form.type} onValueChange={(value: ContentType) => setForm({ ...form, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero</SelectItem>
              <SelectItem value="features">Značajke</SelectItem>
              <SelectItem value="testimonials">Svjedočanstva</SelectItem>
              <SelectItem value="stats">Statistika</SelectItem>
              <SelectItem value="about">O nama</SelectItem>
              <SelectItem value="cta">CTA - poziv buttoni</SelectItem>
              <SelectItem value="slider">Slider</SelectItem>
              <SelectItem value="gallery">Galerija slika</SelectItem>
              <SelectItem value="contact">Kontakt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Naslov *</Label>
          <Input
            id="title"
            placeholder="Naslov sekcije"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Podnaslov</Label>
          <Textarea
            id="subtitle"
            placeholder="Podnaslov (opcionalno)"
            value={form.subtitle || ''}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
          />
          <Label>Aktivno</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} className='bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'>Otkaži</Button>
        <Button onClick={handleSubmit} className='bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2'>Kreiraj sekciju</Button>
      </DialogFooter>
    </>
  );
}


function EditContentForm({ 
  content, 
  onSave, 
  onCancel,
  onOpenFileManager 
}: { 
  content: CMSContent; 
  onSave: (data: Partial<CMSContent>) => void; 
  onCancel: () => void;
  onOpenFileManager: (setter: (url: string) => void) => void;
}) {
  const [form, setForm] = useState<Partial<CMSContent>>(content);

  const handleSubmit = () => {
    if (!form.title?.trim()) {
      toast.error('Molimo, unesite naslov!');
      return;
    }
    onSave(form);
  };

  const renderContentFields = () => {
    switch (content.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Hero Sadržaj</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tekst dugmeta</Label>
                <Input
                  value={form.content?.ctaText || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, ctaText: e.target.value }
                  })}
                  placeholder="Get Started"
                />
              </div>
              <div className="space-y-2">
                <Label>Link dugmeta</Label>
                <Input
                  value={form.content?.ctaLink || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, ctaLink: e.target.value }
                  })}
                  placeholder="/login"
                />
              </div>
            </div>
            <ImageField
              value={form.content?.backgroundImage || ''}
              onChange={(value) => setForm({
                ...form,
                content: { ...form.content, backgroundImage: value }
              })}
              label="Pozadinska slika"
              onOpenFileManager={onOpenFileManager}
            />
          </div>
        );

              case 'testimonials':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">Svjedočenja korisnika</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className='bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2'
                onClick={() => {
                  const newItems = [...(form.content?.items || [])];
                  newItems.push({ name: '', role: '', text: '', rating: 5 });
                  setForm({
                    ...form,
                    content: { ...form.content, items: newItems }
                  });
                }}
              >
                <Plus size={16} className="mr-1" />
                Dodaj
              </Button>
            </div>
            {(form.content?.items || []).map((item: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ime</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].name = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      placeholder="Ime"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Uloga</Label>
                    <Input
                      value={item.role}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].role = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      placeholder="Klijent/Vozač"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tekst</Label>
                  <Textarea
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...form.content.items];
                      newItems[index].text = e.target.value;
                      setForm({
                        ...form,
                        content: { ...form.content, items: newItems }
                      });
                    }}
                    rows={3}
                    placeholder="Tekst"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Slika korisnika (opcionalno)</Label>
                    <ImageField
                      value={item.avatar || ''}
                      onChange={(value) => {
                        const newItems = [...form.content.items];
                        newItems[index].avatar = value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      label=""
                      onOpenFileManager={onOpenFileManager}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ocjena (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={item.rating}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].rating = parseInt(e.target.value);
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItems = form.content.items.filter((_: any, i: number) => i !== index);
                    setForm({
                      ...form,
                      content: { ...form.content, items: newItems }
                    });
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Trash2 size={14} className="mr-1" />
                  Ukloni
                </Button>
              </div>
            ))}
          </div>
        );


      case 'stats':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">Statistika</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className='bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2'
                onClick={() => {
                  const newItems = [...(form.content?.items || [])];
                  newItems.push({ value: '', label: '', suffix: '' });
                  setForm({
                    ...form,
                    content: { ...form.content, items: newItems }
                  });
                }}
              >
                <Plus size={16} className="mr-1" />
                Dodaj
              </Button>
            </div>
            {(form.content?.items || []).map((item: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Vrijednost</Label>
                    <Input
                      value={item.value}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].value = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Naziv</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].label = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      placeholder="Zadovoljnih klijenata"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Oznaka</Label>
                    <Input
                      value={item.suffix || ''}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].suffix = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      placeholder="+"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItems = form.content.items.filter((_: any, i: number) => i !== index);
                    setForm({
                      ...form,
                      content: { ...form.content, items: newItems }
                    });
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Trash2 size={14} className="mr-1" />
                  Ukloni
                </Button>
              </div>
            ))}
          </div>
        );


      case 'about':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-lg">O nama</h4>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.content?.description || ''}
                onChange={(e) => setForm({
                  ...form,
                  content: { ...form.content, description: e.target.value }
                })}
                rows={6}
                placeholder="O nama..."
              />
            </div>
            <ImageField
              value={form.content?.image || ''}
              onChange={(value) => setForm({
                ...form,
                content: { ...form.content, image: value }
              })}
              label="Slika o nama"
              onOpenFileManager={onOpenFileManager}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tekst dugmeta</Label>
                <Input
                  value={form.content?.buttonText || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, buttonText: e.target.value }
                  })}
                  placeholder="Registruj se"
                />
              </div>
              <div className="space-y-2">
                <Label>Link dugmeta</Label>
                <Input
                  value={form.content?.buttonLink || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, buttonLink: e.target.value }
                  })}
                  placeholder="/register"
                />
              </div>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Poziv na akciju</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tekst dugmeta</Label>
                <Input
                  value={form.content?.buttonText || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, buttonText: e.target.value }
                  })}
                  placeholder="Registracija"
                />
              </div>
              <div className="space-y-2">
                <Label>Link dugmeta</Label>
                <Input
                  value={form.content?.buttonLink || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, buttonLink: e.target.value }
                  })}
                  placeholder="/register"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tekst dugmeta 2</Label>
                <Input
                  value={form.content?.secondaryButtonText || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, secondaryButtonText: e.target.value }
                  })}
                  placeholder="Prijavi se"
                />
              </div>
              <div className="space-y-2">
                <Label>Link dugmeta 2</Label>
                <Input
                  value={form.content?.secondaryButtonLink || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, secondaryButtonLink: e.target.value }
                  })}
                  placeholder="/login"
                />
              </div>
            </div>
          </div>
        );

        case 'slider':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">Slider za slike</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className='bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                onClick={() => {
                  const newSlides = [...(form.content?.slides || [])];
                  newSlides.push({ title: '', description: '', image: '', link: '', ctaText: '' });
                  setForm({
                    ...form,
                    content: { ...form.content, slides: newSlides }
                  });
                }}
              >
                <Plus size={16} className="mr-1" />
                Dodaj slajd
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.content?.autoplay !== false}
                  onCheckedChange={(checked) => setForm({
                    ...form,
                    content: { ...form.content, autoplay: checked }
                  })}
                />
                <Label>Autoplay</Label>
              </div>
              <div className="space-y-2">
                <Label>Autoplay Interval (ms)</Label>
                <Input
                  type="number"
                  value={form.content?.interval || 5000}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, interval: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            {(form.content?.slides || []).map((slide: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                <ImageField
                  value={slide.image || ''}
                  onChange={(value) => {
                    const newSlides = [...form.content.slides];
                    newSlides[index].image = value;
                    setForm({
                      ...form,
                      content: { ...form.content, slides: newSlides }
                    });
                  }}
                  label="Slide Image"
                  onOpenFileManager={onOpenFileManager}
                />
                <div className="space-y-2">
                  <Label>Naslov (opcionalno)</Label>
                  <Input
                    value={slide.title}
                    onChange={(e) => {
                      const newSlides = [...form.content.slides];
                      newSlides[index].title = e.target.value;
                      setForm({
                        ...form,
                        content: { ...form.content, slides: newSlides }
                      });
                    }}
                    placeholder="Naslov (opcionalno)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Opis (opcionalno)</Label>
                  <Textarea
                    value={slide.description}
                    onChange={(e) => {
                      const newSlides = [...form.content.slides];
                      newSlides[index].description = e.target.value;
                      setForm({
                        ...form,
                        content: { ...form.content, slides: newSlides }
                      });
                    }}
                    rows={2}
                    placeholder="Opis (opcionalno)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Link (opcionalno)</Label>
                    <Input
                      value={slide.link || ''}
                      onChange={(e) => {
                        const newSlides = [...form.content.slides];
                        newSlides[index].link = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, slides: newSlides }
                        });
                      }}
                      placeholder="www.deliver4me.ba"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tekst dugmeta</Label>
                    <Input
                      value={slide.ctaText || ''}
                      onChange={(e) => {
                        const newSlides = [...form.content.slides];
                        newSlides[index].ctaText = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, slides: newSlides }
                        });
                      }}
                      placeholder="Otvori"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSlides = form.content.slides.filter((_: any, i: number) => i !== index);
                    setForm({
                      ...form,
                      content: { ...form.content, slides: newSlides }
                    });
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Trash2 size={14} className="mr-1" />
                  Ukloni
                </Button>
              </div>
            ))}
          </div>
        );


     case 'gallery':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">Galerija sliika</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className='bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                onClick={() => {
                  const newImages = [...(form.content?.images || [])];
                  newImages.push({ src: '', alt: '', caption: '' });
                  setForm({
                    ...form,
                    content: { ...form.content, images: newImages }
                  });
                }}
              >
                <Plus size={16} className="mr-1" />
                Dodaj
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Broj kolona</Label>
              <Select 
                value={form.content?.columns?.toString() || '3'} 
                onValueChange={(value) => setForm({
                  ...form,
                  content: { ...form.content, columns: parseInt(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Kolone</SelectItem>
                  <SelectItem value="3">3 Kolone</SelectItem>
                  <SelectItem value="4">4 Kolone</SelectItem>
                  <SelectItem value="5">5 Kolona</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(form.content?.images || []).map((image: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                <ImageField
                  value={image.src}
                  onChange={(value) => {
                    const newImages = [...form.content.images];
                    newImages[index].src = value;
                    setForm({
                      ...form,
                      content: { ...form.content, images: newImages }
                    });
                  }}
                  label="Slika"
                  onOpenFileManager={onOpenFileManager}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Alt Tekst (opcionalno)</Label>
                    <Input
                      value={image.alt}
                      onChange={(e) => {
                        const newImages = [...form.content.images];
                        newImages[index].alt = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, images: newImages }
                        });
                      }}
                      placeholder="Opis slike"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Naziv (opcionalno)</Label>
                    <Input
                      value={image.caption || ''}
                      onChange={(e) => {
                        const newImages = [...form.content.images];
                        newImages[index].caption = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, images: newImages }
                        });
                      }}
                      placeholder="Naziv slike"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newImages = form.content.images.filter((_: any, i: number) => i !== index);
                    setForm({
                      ...form,
                      content: { ...form.content, images: newImages }
                    });
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Trash2 size={14} className="mr-1" />
                 Ukloni
                </Button>
              </div>
            ))}
          </div>
        );


      case 'contact':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Kontakt</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.content?.email || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, email: e.target.value }
                  })}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={form.content?.phone || ''}
                  onChange={(e) => setForm({
                    ...form,
                    content: { ...form.content, phone: e.target.value }
                  })}
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adresa</Label>
              <Textarea
                value={form.content?.address || ''}
                onChange={(e) => setForm({
                  ...form,
                  content: { ...form.content, address: e.target.value }
                })}
                rows={2}
                placeholder="123 Ulica, Grad, Država"
              />
            </div>
            <div className="space-y-2">
              <Label>Polja forme</Label>
              <div className="space-y-2">
                {['name', 'email', 'phone', 'company', 'message', 'subject'].map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`field-${field}`}
                      checked={form.content?.formFields?.includes(field) || false}
                      onChange={(e) => {
                        const currentFields = form.content?.formFields || [];
                        const newFields: string[] = e.target.checked
                          ? [...currentFields, field]
                          : currentFields.filter((f: string) => f !== field);
                        setForm({
                          ...form,
                          content: { ...form.content, formFields: newFields }
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`field-${field}`} className="capitalize">
                      {field}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">Značajke</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className='bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                onClick={() => {
                  const newItems = [...(form.content?.items || [])];
                  newItems.push({ title: '', description: '', icon: 'Check' });
                  setForm({
                    ...form,
                    content: { ...form.content, items: newItems }
                  });
                }}
              >
                <Plus size={16} className="mr-1" />
                Dodaj
              </Button>
            </div>
            {(form.content?.items || []).map((item: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Naziv</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].title = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      placeholder="Feature title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ikona (check, truck, box)</Label>
                    <Input
                      value={item.icon}
                      onChange={(e) => {
                        const newItems = [...form.content.items];
                        newItems[index].icon = e.target.value;
                        setForm({
                          ...form,
                          content: { ...form.content, items: newItems }
                        });
                      }}
                      placeholder="Check, Truck, Box."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Opis</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...form.content.items];
                      newItems[index].description = e.target.value;
                      setForm({
                        ...form,
                        content: { ...form.content, items: newItems }
                      });
                    }}
                    rows={2}
                    placeholder="Opis"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItems = form.content.items.filter((_: any, i: number) => i !== index);
                    setForm({
                      ...form,
                      content: { ...form.content, items: newItems }
                    });
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Trash2 size={14} className="mr-1" />
                  Ukloni
                </Button>
              </div>
            ))}
          </div>
        );

   
      default:
        return (
          <div className="space-y-2">
            <Label>Sadržaj (JSON)</Label>
            <Textarea
              value={JSON.stringify(form.content || {}, null, 2)}
              onChange={(e) => {
                try {
                  const content = JSON.parse(e.target.value);
                  setForm({ ...form, content });
                } catch {
                  // Invalid JSON
                }
              }}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          Uredi {content.type} sekciju
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
            {content.type}
          </span>
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Naslov *</Label>
          <Input
            id="title"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Naslov"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Podnaslov</Label>
          <Textarea
            id="subtitle"
            value={form.subtitle || ''}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            rows={2}
            placeholder="Podnaslov"
          />
        </div>

        {renderContentFields()}

        <div className="space-y-4">
  <h4 className="font-medium text-lg">Dodatna stilizacija</h4>
  
  <div className="flex flex-wrap gap-6 items-center">
    <div className="space-y-2 w-full md:w-auto">
      <Label>Pozadinska boja</Label>
      <Select
        value={form.metadata?.backgroundColor || 'default'}
        onValueChange={(value) =>
          setForm({
            ...form,
            metadata: {
              ...form.metadata,
              backgroundColor: value === 'default' ? undefined : value,
            },
          })
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Odaberite pozadinsku boju" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="#1c2434">Standardna</SelectItem>
          <SelectItem value="#1c2434">Tamno plava</SelectItem>
          <SelectItem value="#0f172a">Tamna</SelectItem>
          <SelectItem value="#ffffff">Svijetla</SelectItem>
          <SelectItem value="#f8fafc">Svijetlo siva</SelectItem>
          <SelectItem value="#f1f5f9">Jako svijetla</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2 w-full md:w-auto">
      <Label>Text Color</Label>
      <Select
        value={form.metadata?.textColor || 'auto'}
        onValueChange={(value) =>
          setForm({
            ...form,
            metadata: {
              ...form.metadata,
              textColor: value === 'auto' ? undefined : value,
            },
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Odaberite boju teksta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto</SelectItem>
          <SelectItem value="#ffffff">Bijela</SelectItem>
          <SelectItem value="#000000">Crna</SelectItem>
          <SelectItem value="#1f2937">Tamno siva</SelectItem>
          <SelectItem value="#374151">Siva</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2 w-full md:w-auto">
      <Label>Poravnanje</Label>
      <Select
        value={form.metadata?.layout || 'default'}
        onValueChange={(value) =>
          setForm({
            ...form,
            metadata: {
              ...form.metadata,
              layout: value === 'default' ? undefined : value,
            },
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Odaberite poravnanje" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Standard</SelectItem>
          <SelectItem value="centered">Centar</SelectItem>
          <SelectItem value="left-aligned">Lijevo</SelectItem>
          <SelectItem value="right-aligned">Desno</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex items-center space-x-2 pt-6 w-full md:w-auto">
      <Switch
        checked={form.isActive}
        onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
      />
      <Label>Aktivno</Label>
    </div>
  </div>
</div>


        
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} className="bg-red-500 hover:bg-red-600 text-white font-medium mt-1 py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Otkaži</Button>
        <Button onClick={handleSubmit}  className="bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 mt-1 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
          <Save size={16}/>
          Sačuvaj
        </Button>
      </DialogFooter>
    </>
  );
}
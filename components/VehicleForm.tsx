"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Select from "react-select";
import { Input } from "@/components/ui/input"

const schema = z.object({
  brand: z.string().min(1, "Obavezno polje"),
  model: z.string().min(1, "Obavezno polje"),
  plateNumber: z.string().min(1, "Obavezno polje"),
  width: z.number().min(0.1).max(10),
  length: z.number().min(0.1).max(20),
  height: z.number().min(0.1).max(5),
  vehicleTypeId: z.string().min(1, "Odaberite tip vozila"),
});

type FormValues = z.infer<typeof schema>;

interface VehicleFormProps {
  initialData?: any;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function VehicleForm({ initialData, open, onClose, onSaved }: VehicleFormProps) {
  const [vehicleTypes, setVehicleTypes] = useState<{ _id: string; name: string }[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand: "",
      model: "",
      plateNumber: "",
      width: 0,
      length: 0,
      height: 0,
      vehicleTypeId: "",
    },
  });

  useEffect(() => {
    axios.get("/api/vehicle-types").then((res) => setVehicleTypes(res.data));
  }, []);


  useEffect(() => {
    if (initialData) {
      form.reset({
        brand: initialData.brand,
        model: initialData.model,
        plateNumber: initialData.plateNumber,
        width: initialData.width,
        length: initialData.length,
        height: initialData.height,
        vehicleTypeId: initialData.vehicleTypeId || "",
      });
      setImagePreviews(initialData.images || []);
    } else {
      form.reset({
        brand: "",
        model: "",
        plateNumber: "",
        width: 0,
        length: 0,
        height: 0,
        vehicleTypeId: "",
      });
      setImagePreviews([]);
    }
    setFiles([]);
  }, [initialData, form, open]); 

  const width = form.watch("width");
  const length = form.watch("length");
  const height = form.watch("height");
  const volume = (width || 0) * (length || 0) * (height || 0);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [
      ...prev,
      ...newFiles.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeImage = (index: number) => {
    if (index < imagePreviews.length - files.length) {
      const updatedPreviews = [...imagePreviews];
      updatedPreviews.splice(index, 1);
      setImagePreviews(updatedPreviews);
    } else {
      const fileIndex = index - (imagePreviews.length - files.length);
      setFiles((prev) => prev.filter((_, i) => i !== fileIndex));
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const newImagesBase64 = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      const existingImages = initialData?.images?.filter((img: string, index: number) => 
        imagePreviews.includes(img)
      ) || [];
      
      const allImages = [...existingImages, ...newImagesBase64];
      const payload = { ...values, volume, images: allImages };

      if (initialData) {
        await axios.put(`/api/vehicles/${initialData._id}`, payload);
      } else {
        await axios.post("/api/vehicles", payload);
      }

      onSaved();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fas fa-car"></i>
            {initialData ? "Uredi vozilo" : "Dodaj vozilo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["brand", "model", "plateNumber"] as Array<keyof FormValues>).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">
                  {field === "brand" ? "Marka" : field === "model" ? "Model" : "Registracija"}
                </label>
                <Input
                  type="text"
                  {...form.register(field)}
                   className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                {form.formState.errors[field] && (
                  <p className="text-red-500 text-xs">{form.formState.errors[field]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <small>Unesite dimenzije tovarnog prostora.</small>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              {(["width", "length", "height"] as Array<keyof FormValues>).map((dim) => (
                <div key={dim}>
                  <label className="block text-sm font-medium mb-1">
                    {dim === "width"
                      ? "Širina (m)"
                      : dim === "length"
                      ? "Dužina (m)"
                      : "Visina (m)"}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register(dim, { valueAsNumber: true })}
                     className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">Volumen (m³)</label>
                <Input
                  type="text"
                  value={volume.toFixed(2)}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          <div>
           
<Select
  options={vehicleTypes.map(vt => ({ value: vt._id, label: vt.name }))}
  value={vehicleTypes
    .map(vt => ({ value: vt._id, label: vt.name }))
    .find(option => option.value === form.getValues("vehicleTypeId"))}
  onChange={(selected) =>
    form.setValue("vehicleTypeId", selected?.value || "", { shouldDirty: true })
  }
  placeholder="Odaberite tip vozila"
  className="react-select-container"
  classNamePrefix="react-select"
  instanceId="vehicle-type-select"
  isLoading={!vehicleTypes.length}
/>
            {form.formState.errors.vehicleTypeId && (
              <p className="text-red-500 text-xs">{form.formState.errors.vehicleTypeId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slike vozila</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full file-input px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {imagePreviews.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} className="w-24 h-24 object-cover rounded" alt={`Vehicle image ${i + 1}`} />
                  <button
                    type="button"
                    className="btn btn-xs btn-circle absolute -top-2 -right-2"
                    onClick={() => removeImage(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Otkaži
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Spremanje..." : initialData ? "Uredi" : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
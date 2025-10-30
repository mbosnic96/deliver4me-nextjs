"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Select from "react-select";
import { Input } from "@/components/ui/input";

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
  onClose: () => void;
  onSaved: () => void;
}

interface VehicleType {
  _id: string;
  name: string;
}

export function VehicleForm({ initialData, onClose, onSaved }: VehicleFormProps) {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(false);

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
    const fetchVehicleTypes = async () => {
      setLoadingVehicleTypes(true);
      try {
        const res = await fetch("/api/vehicle-types");
        if (!res.ok) throw new Error("Greška pri dohvaćanju tipova vozila");
        const data = await res.json();
        const vehicleTypesData = data.data || data;
        setVehicleTypes(Array.isArray(vehicleTypesData) ? vehicleTypesData : []);
      } catch (error) {
        console.error("Failed to fetch vehicle types:", error);
        setVehicleTypes([]);
      } finally {
        setLoadingVehicleTypes(false);
      }
    };
    fetchVehicleTypes();
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
         vehicleTypeId: initialData.vehicleTypeId?._id || initialData.vehicleTypeId || "",
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
  }, [initialData, form]);

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

      const existingImages =
        initialData?.images?.filter((img: string) =>
          imagePreviews.includes(img)
        ) || [];

      const allImages = [...existingImages, ...newImagesBase64];
      const payload = { ...values, volume, images: allImages };

      let res: Response;

      if (initialData) {
        res = await fetch(`/api/vehicles/${initialData._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Greška pri spremanju vozila");
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving vehicle:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const selectedVehicleType = vehicleTypes
    .map((vt) => ({ value: vt._id, label: vt.name }))
    .find((option) => option.value === form.watch("vehicleTypeId"));

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <i className="fas fa-car"></i>
          {initialData ? "Uredi vozilo" : "Dodaj vozilo"}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["brand", "model", "plateNumber"] as Array<keyof FormValues>).map(
            (field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">
                  {field === "brand"
                    ? "Marka"
                    : field === "model"
                    ? "Model"
                    : "Registracija"}
                </label>
                <Input
                  type="text"
                  {...form.register(field)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                {form.formState.errors[field] && (
                  <p className="text-red-500 text-xs">
                    {form.formState.errors[field]?.message}
                  </p>
                )}
              </div>
            )
          )}
        </div>

        <div>
          <small>Unesite dimenzije tovarnog prostora.</small>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            {(["width", "length", "height"] as Array<keyof FormValues>).map(
              (dim) => (
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
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                Volumen (m³)
              </label>
              <Input
                type="text"
                value={volume.toFixed(2)}
                readOnly
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tip vozila</label>
          <Select
            options={vehicleTypes.map((vt) => ({ value: vt._id, label: vt.name }))}
            value={selectedVehicleType}
            onChange={(selected) =>
              form.setValue("vehicleTypeId", selected?.value || "", { shouldDirty: true })
            }
            placeholder="Odaberite tip vozila"
            isLoading={loadingVehicleTypes}
          />
          {form.formState.errors.vehicleTypeId && (
            <p className="text-red-500 text-xs">
              {form.formState.errors.vehicleTypeId.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slike vozila</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="w-full"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {imagePreviews.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={img}
                  className="w-24 h-24 object-cover rounded"
                  alt={`Vehicle image ${i + 1}`}
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  onClick={() => removeImage(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
            Otkaži
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-700 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {isLoading ? "Spremanje..." : initialData ? "Uredi" : "Sačuvaj"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
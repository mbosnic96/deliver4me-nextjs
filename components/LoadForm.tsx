'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LeafletMap } from './LeafletMap'
import { getCountries, getStates, getCities, getCityLatLng } from '../lib/services/CscService'
import Swal from 'sweetalert2'
import Select from 'react-select'
import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import moment from 'moment';
import 'moment/locale/bs';
import { toast } from "react-toastify";

interface LoadFormProps {
  initialData?: any
  onClose: () => void
  onSaved: () => void
}

export const LoadForm: React.FC<LoadFormProps> = ({ initialData, onClose, onSaved }) => {
  const [form, setForm] = useState<any>({
    title: '',
    description: '',
    pickupCountry: null,
    pickupState: null,
    pickupCity: null,
    pickupAddress: '',
    deliveryCountry: null,
    deliveryState: null,
    deliveryCity: null,
    deliveryAddress: '',
    contactPerson: '',
    contactPhone: '',
    preferredPickupDate: '',
    preferredDeliveryDate: '',
    pickupTime: '',
    maxDeliveryTime: '',
    cargoWeight: '',
    cargoWidth: '',
    cargoHeight: '',
    cargoLength: '',
    cargoVolume: '',
    fixedPrice: '',
    pickupLatitude: 0,
    pickupLongitude: 0,
    deliveryLatitude: 0,
    deliveryLongitude: 0,
    status: 'Aktivan',
    images: []
  })

  const [isDirty, setIsDirty] = useState(false)
  const [countries, setCountries] = useState<any[]>([])
  const [pickupStates, setPickupStates] = useState<any[]>([])
  const [pickupCities, setPickupCities] = useState<any[]>([])
  const [deliveryStates, setDeliveryStates] = useState<any[]>([])
  const [deliveryCities, setDeliveryCities] = useState<any[]>([])
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(user => setCurrentUser(user))
  }, []);

  useEffect(() => {
    setCountries(getCountries().map(c => ({ value: c.value, label: c.label })))

    const mapOption = (val: string, options: any[]) => {
      if (!val) return null
      const found = options.find(o => o.value === val)
      return found || { value: val, label: val }
    }

    if (initialData) {
      setForm((prev: any) => ({
        ...prev,
        ...initialData,
        pickupCountry: mapOption(initialData.pickupCountry, getCountries()),
        pickupState: mapOption(initialData.pickupState, getStates(initialData.pickupCountry)),
        pickupCity: mapOption(initialData.pickupCity, getCities(initialData.pickupCountry, initialData.pickupState)),
        deliveryCountry: mapOption(initialData.deliveryCountry, getCountries()),
        deliveryState: mapOption(initialData.deliveryState, getStates(initialData.deliveryCountry)),
        deliveryCity: mapOption(initialData.deliveryCity, getCities(initialData.deliveryCountry, initialData.deliveryState)),
        pickupLatitude: initialData.pickupLatitude ?? 0,
        pickupLongitude: initialData.pickupLongitude ?? 0,
        images: initialData.images || []
      }))

      if (initialData.pickupCountry) setPickupStates(getStates(initialData.pickupCountry).map(s => ({ value: s.value, label: s.label })))
      if (initialData.pickupState) setPickupCities(getCities(initialData.pickupCountry, initialData.pickupState).map(c => ({ value: c.value, label: c.label })))
      if (initialData.deliveryCountry) setDeliveryStates(getStates(initialData.deliveryCountry).map(s => ({ value: s.value, label: s.label })))
      if (initialData.deliveryState) setDeliveryCities(getCities(initialData.deliveryCountry, initialData.deliveryState).map(c => ({ value: c.value, label: c.label })))
      if (initialData.images) setImagePreviews(initialData.images)
    } else if (currentUser) {
      const userCountry = currentUser.country ? mapOption(currentUser.country, getCountries()) : null
      const userState = currentUser.state && userCountry ? mapOption(currentUser.state, getStates(userCountry.value)) : null
      const userCity = currentUser.city && userState && userCountry ? mapOption(currentUser.city, getCities(userCountry.value, userState.value)) : null

      setForm((prev: any) => ({
        ...prev,
        pickupCountry: userCountry,
        pickupState: userState,
        pickupCity: userCity,
        pickupAddress: currentUser.address ?? '',
        pickupLatitude: currentUser.latitude ?? 0,
        pickupLongitude: currentUser.longitude ?? 0
      }))

      if (userCountry) setPickupStates(getStates(userCountry.value).map(s => ({ value: s.value, label: s.label })))
      if (userState) setPickupCities(getCities(userCountry.value, userState.value).map(c => ({ value: c.value, label: c.label })))
    }
  }, [initialData, currentUser])

  const handleChange = (field: string, value: any) => {
    setForm((prev: typeof form) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handlePickupCountryChange = (option: any) => {
    handleChange('pickupCountry', option)
    handleChange('pickupState', null)
    handleChange('pickupCity', null)
    setPickupStates(option ? getStates(option.value).map(s => ({ value: s.value, label: s.label })) : [])
    setPickupCities([])
  }

  const handlePickupStateChange = (option: any) => {
    handleChange('pickupState', option)
    handleChange('pickupCity', null)
    setPickupCities(option ? getCities(form.pickupCountry.value, option.value).map(c => ({ value: c.value, label: c.label })) : [])
  }

  const handlePickupCityChange = async (option: any) => {
    const coords = await getCityLatLng(option.value, form.pickupCountry.value, form.pickupState.value)
    handleChange('pickupCity', option)
    handleChange('pickupLatitude', coords?.lat ?? 0)
    handleChange('pickupLongitude', coords?.lng ?? 0)
  }

  const handleDeliveryCountryChange = (option: any) => {
    handleChange('deliveryCountry', option)
    handleChange('deliveryState', null)
    handleChange('deliveryCity', null)
    setDeliveryStates(option ? getStates(option.value).map(s => ({ value: s.value, label: s.label })) : [])
    setDeliveryCities([])
  }

  const handleDeliveryStateChange = (option: any) => {
    handleChange('deliveryState', option)
    handleChange('deliveryCity', null)
    setDeliveryCities(option ? getCities(form.deliveryCountry.value, option.value).map(c => ({ value: c.value, label: c.label })) : [])
  }

  const handleDeliveryCityChange = async (option: any) => {
    const coords = await getCityLatLng(option.value, form.deliveryCountry.value, form.deliveryState.value)
    handleChange('deliveryCity', option)
    handleChange('deliveryLatitude', coords?.lat ?? 0)
    handleChange('deliveryLongitude', coords?.lng ?? 0)
  }

  useEffect(() => {
    const width = parseFloat(form.cargoWidth) || 0
    const height = parseFloat(form.cargoHeight) || 0
    const length = parseFloat(form.cargoLength) || 0
    handleChange('cargoVolume', (width * height * length).toFixed(2))
  }, [form.cargoWidth, form.cargoHeight, form.cargoLength])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setSelectedImages(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))])
    setIsDirty(true)
  }

  const removeImage = (index: number) => {
    const removed = imagePreviews[index]
    if (removed.startsWith('/uploads')) {
      setImagesToRemove(prev => [...prev, removed])
    }

    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  const handleClose = useCallback(() => {
    if (isDirty && !showCloseWarning) {
      setShowCloseWarning(true)
      Swal.fire({
        icon: 'warning',
        title: 'Neunesene promjene',
        text: 'Imate neunesene promjene. Sigurno želite zatvoriti?',
        showCancelButton: true,
        confirmButtonText: 'Da, zatvori',
        cancelButtonText: 'Ostani',
        customClass: { popup: 'pointer-events-auto' }
      }).then(result => {
        setShowCloseWarning(false)
        if (result.isConfirmed) onClose()
      })
    } else if (!isDirty) {
      onClose()
    }
  }, [isDirty, showCloseWarning, onClose])

  const handleSubmit = async () => {
    setIsLoading(true);

    const requiredFields = [
      "title", "description",
      "pickupCountry", "pickupState", "pickupCity", "pickupAddress",
      "deliveryCountry", "deliveryState", "deliveryCity", "deliveryAddress",
      "contactPerson", "contactPhone",
      "cargoWeight", "cargoWidth", "cargoHeight", "cargoLength", "fixedPrice"
    ];

    for (const field of requiredFields) {
      const val = form[field];
      if (!val || (typeof val === "object" && !val.value)) {
        toast.warning(`Molimo Vas, ispunite sva polja.`);
        setIsLoading(false);
        return;
      }
    }

    const fixedPrice = parseFloat(form.fixedPrice);
    if (currentUser.balance < fixedPrice) {
      toast.error("Nemate dovoljno novca na računu za objavu ovog tereta.");
      setIsLoading(false);
      return;
    }

    try {
      const jsonData = { ...form };
      ['pickupCountry', 'pickupState', 'pickupCity', 'deliveryCountry', 'deliveryState', 'deliveryCity'].forEach(f => {
        if (jsonData[f] && typeof jsonData[f] === 'object') jsonData[f] = jsonData[f].value;
      });

      const url = initialData?.id ? `/api/loads/${initialData.id}` : '/api/loads';
      const method = initialData?.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        body: JSON.stringify(jsonData),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save load');
      }

      const result = await res.json();
      const loadId = result._id || initialData?.id;

      if (selectedImages.length > 0) await uploadImages(loadId, selectedImages);

      for (const imageUrl of imagesToRemove) {
        await fetch(`/api/loads/${loadId}/images`, {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl }),
          headers: { 'Content-Type': 'application/json' }
        });
      }

      setImagesToRemove([]);
      toast.success('Teret uspješno sačuvan!');
      setIsDirty(false);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Došlo je do greške prilikom spremanja tereta.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImages = async (loadId: string, images: File[]) => {
    if (!images.length) return
    const formData = new FormData()
    images.forEach(file => formData.append('images', file))

    try {
      const res = await fetch(`/api/loads/${loadId}/images`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed to upload images')
      const data = await res.json()
      handleChange('images', [...form.images, ...(data.images || [])])
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'warning', title: 'Upozorenje', text: 'Slike nisu uspješno uploadane.', timer: 3000, showConfirmButton: false, customClass: { popup: 'pointer-events-auto' } })
    }
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent className="overflow-y-auto max-h-[90vh] w-[95vw] max-w-[1200px] p-4 md:p-6 content-bg">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">{initialData ? 'Uredi teret' : 'Dodaj novi teret'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
          <div className="space-y-3">
            <div>
              <label className="block font-semibold mb-1 text-sm md:text-base">Naslov</label>
              <input 
                className="w-full border rounded px-3 py-2 text-sm md:text-base" 
                value={form.title} 
                onChange={e => handleChange('title', e.target.value)} 
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-sm md:text-base">Opis</label>
              <textarea 
                className="w-full border rounded px-3 py-2 min-h-[100px] text-sm md:text-base" 
                value={form.description} 
                onChange={e => handleChange('description', e.target.value)} 
              />
            </div>
          </div>

          <div className="border rounded p-3 md:p-4 space-y-3">
            <h6 className="font-semibold text-base md:text-lg">Lokacija preuzimanja</h6>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-sm">Država</label>
                <Select 
                  options={countries} 
                  value={form.pickupCountry} 
                  onChange={handlePickupCountryChange} 
                  placeholder="Država"
                  className="text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Regija</label>
                <Select 
                  options={pickupStates} 
                  value={form.pickupState} 
                  onChange={handlePickupStateChange} 
                  placeholder="Regija"
                  className="text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Grad</label>
                <Select 
                  options={pickupCities} 
                  value={form.pickupCity} 
                  onChange={handlePickupCityChange} 
                  placeholder="Grad"
                  className="text-sm text-gray-900"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-sm md:text-base">Adresa preuzimanja</label>
                <input 
                  className="w-full border rounded p-2 text-sm md:text-base" 
                  placeholder="Adresa preuzimanja" 
                  value={form.pickupAddress} 
                  onChange={e => handleChange('pickupAddress', e.target.value)} 
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm md:text-base">Datum i vrijeme preuzimanja</label>
                <Datetime
                  value={form.preferredPickupDate ? new Date(form.preferredPickupDate) : undefined}
                  onChange={(val: any) => handleChange('preferredPickupDate', val instanceof Date ? val.toISOString() : val)}
                  inputProps={{ className: 'w-full border rounded p-2 text-sm md:text-base' }}
                />
              </div>
            </div>
            
            <div className="h-48 md:h-64">
              <LeafletMap
                lat={form.pickupLatitude}
                lng={form.pickupLongitude}
                onChange={(lat, lng) => { handleChange('pickupLatitude', lat); handleChange('pickupLongitude', lng) }}
              />
            </div>
          </div>

          <div className="border rounded p-3 md:p-4 space-y-3">
            <h6 className="font-semibold text-base md:text-lg">Lokacija isporuke</h6>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded p-2 text-sm md:text-base" placeholder="Kontakt osoba" value={form.contactPerson} onChange={e => handleChange('contactPerson', e.target.value)} />
              <input className="border rounded p-2 text-sm md:text-base" placeholder="Kontakt telefon" value={form.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-sm">Država</label>
                <Select options={countries} value={form.deliveryCountry} onChange={handleDeliveryCountryChange} placeholder="Država" className="text-sm  text-gray-900" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Regija</label>
                <Select options={deliveryStates} value={form.deliveryState} onChange={handleDeliveryStateChange} placeholder="Regija" className="text-sm text-gray-900" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Grad</label>
                <Select options={deliveryCities} value={form.deliveryCity} onChange={handleDeliveryCityChange} placeholder="Grad" className="text-sm text-gray-900" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-sm md:text-base">Adresa isporuke</label>
                <input className="w-full border rounded p-2 text-sm md:text-base" placeholder="Adresa isporuke" value={form.deliveryAddress} onChange={e => handleChange('deliveryAddress', e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm md:text-base">Datum i vrijeme isporuke</label>
                <Datetime
                  value={form.preferredDeliveryDate ? new Date(form.preferredDeliveryDate) : undefined}
                  onChange={(val: any) => handleChange('preferredDeliveryDate', val instanceof Date ? val.toISOString() : val)}
                  inputProps={{ className: 'w-full border rounded p-2 text-sm md:text-base' }}
                />
              </div>
            </div>
            
            <div className="h-48 md:h-64">
              <LeafletMap
                lat={form.deliveryLatitude}
                lng={form.deliveryLongitude}
                onChange={(lat, lng) => { handleChange('deliveryLatitude', lat); handleChange('deliveryLongitude', lng) }}
              />
            </div>
          </div>

          <div className="border rounded p-3 md:p-4 space-y-3">
            <h6 className="font-semibold text-base md:text-lg">Detalji tereta</h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-sm">Težina (kg)</label>
                <input className="w-full border rounded p-2 text-sm" value={form.cargoWeight} onChange={e => handleChange('cargoWeight', e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Širina (m)</label>
                <input className="w-full border rounded p-2 text-sm" value={form.cargoWidth} onChange={e => handleChange('cargoWidth', e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Visina (m)</label>
                <input className="w-full border rounded p-2 text-sm" value={form.cargoHeight} onChange={e => handleChange('cargoHeight', e.target.value)} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-sm">Dužina (m)</label>
                <input className="w-full border rounded p-2 text-sm" value={form.cargoLength} onChange={e => handleChange('cargoLength', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1 text-sm">Volumen (m³)</label>
                <input className="w-full border rounded p-2 text-sm" placeholder="Volumen (m³)" value={form.cargoVolume} readOnly />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1 text-sm">Fiksna cijena</label>
                <input className="w-full border rounded p-2 text-sm" placeholder="Fiksna cijena" value={form.fixedPrice} onChange={e => handleChange('fixedPrice', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border rounded p-3 md:p-4 space-y-3">
            <h6 className="font-semibold text-base md:text-lg">Slike tereta</h6>
            <input type="file" multiple onChange={handleImageSelect} className="w-full text-sm" />
            <div className="flex gap-2 flex-wrap mt-2">
              {imagePreviews.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 md:w-24 md:h-24 border rounded overflow-hidden">
                  <img src={img} className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-xs" onClick={() => removeImage(idx)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse md:flex-row gap-2 md:gap-0 pt-4 border-t mt-4">
          <Button onClick={handleClose} variant="outline" className="w-full md:w-auto text-sm md:text-base">Otkaži</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full md:w-auto text-sm md:text-base">
            {isLoading ? 'Spremanje...' : 'Spremi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
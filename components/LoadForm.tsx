'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LeafletMap } from './LeafletMap'
import { getCountries, getStates, getCities, getCityLatLng } from '../lib/services/CscService'
import Swal from 'sweetalert2'
import Select from 'react-select'

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
    status: 'Aktivan'
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

  // Initialize countries and form
  useEffect(() => {
    setCountries(getCountries().map(c => ({ value: c.value, label: c.label })))
    if (initialData) {
      setForm({
        ...form,
        ...initialData,
        pickupCountry: initialData.pickupCountry ? { value: initialData.pickupCountry, label: initialData.pickupCountry } : null,
        pickupState: initialData.pickupState ? { value: initialData.pickupState, label: initialData.pickupState } : null,
        pickupCity: initialData.pickupCity ? { value: initialData.pickupCity, label: initialData.pickupCity } : null,
        deliveryCountry: initialData.deliveryCountry ? { value: initialData.deliveryCountry, label: initialData.deliveryCountry } : null,
        deliveryState: initialData.deliveryState ? { value: initialData.deliveryState, label: initialData.deliveryState } : null,
        deliveryCity: initialData.deliveryCity ? { value: initialData.deliveryCity, label: initialData.deliveryCity } : null
      })
      if (initialData.pickupCountry) setPickupStates(getStates(initialData.pickupCountry).map(s => ({ value: s.value, label: s.label })))
      if (initialData.pickupState) setPickupCities(getCities(initialData.pickupCountry, initialData.pickupState).map(c => ({ value: c.value, label: c.label })))
      if (initialData.deliveryCountry) setDeliveryStates(getStates(initialData.deliveryCountry).map(s => ({ value: s.value, label: s.label })))
      if (initialData.deliveryState) setDeliveryCities(getCities(initialData.deliveryCountry, initialData.deliveryState).map(c => ({ value: c.value, label: c.label })))
      if (initialData.images) {
        setImagePreviews(initialData.images)
      }
    }
  }, [initialData])

  // Form change
  const handleChange = (field: string, value: any) => {
    setForm((prev: typeof form) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  // CSC handlers
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

  // Auto volume
  useEffect(() => {
    const width = parseFloat(form.cargoWidth) || 0
    const height = parseFloat(form.cargoHeight) || 0
    const length = parseFloat(form.cargoLength) || 0
    handleChange('cargoVolume', (width * height * length).toFixed(2))
  }, [form.cargoWidth, form.cargoHeight, form.cargoLength])

  // Image handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setSelectedImages(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))])
    setIsDirty(true)
  }
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  // Dialog close with warning
  const handleClose = useCallback(() => {
    if (isDirty && !showCloseWarning) {
      setShowCloseWarning(true)
      Swal.fire({
        icon: 'warning',
        title: 'Neunesene promjene',
        text: 'Imate neunesene promjene. Sigurno želite zatvoriti?',
        showCancelButton: true,
        confirmButtonText: 'Da, zatvori',
        customClass: { popup: 'pointer-events-auto' },
        cancelButtonText: 'Ostani'
      }).then(result => {
        setShowCloseWarning(false)
        if (result.isConfirmed) onClose()
      })
    } else {
      onClose()
    }
  }, [isDirty, showCloseWarning, onClose])

  // Submit form
  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const jsonData = { ...form }
      ;['pickupCountry','pickupState','pickupCity','deliveryCountry','deliveryState','deliveryCity'].forEach(f => {
        if (jsonData[f] && typeof jsonData[f] === 'object') jsonData[f] = jsonData[f].value
      })
      const url = initialData?.id ? `/api/loads/${initialData.id}` : '/api/loads'
      const method = initialData?.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        body: JSON.stringify(jsonData),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to save load')
      const result = await res.json()

      // Upload images
      if (selectedImages.length > 0) await uploadImages(result.id || initialData.id, selectedImages)

      Swal.fire({ icon: 'success', title: 'Uspjeh',customClass: { popup: 'pointer-events-auto' }, text: 'Teret uspješno sačuvan!', timer: 2000, showConfirmButton: false })
      setIsDirty(false)
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', customClass: { popup: 'pointer-events-auto' },title: 'Greška', text: 'Došlo je do greške prilikom spremanja tereta.' })
    } finally {
      setIsLoading(false)
    }
  }

  const uploadImages = async (loadId: string, images: File[]) => {
    const formData = new FormData()
    images.forEach(file => formData.append('images', file))
    try {
      const res = await fetch(`/api/loads/${loadId}/images`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed to upload images')
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'warning', title: 'Upozorenje',customClass: { popup: 'pointer-events-auto' }, text: 'Slike nisu uspješno uploadane.', timer: 3000, showConfirmButton: false })
    }
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent className="overflow-y-auto max-h-[90vh] min-w-[65vw] max-w-[1200px] p-6">
        <DialogHeader><DialogTitle>{initialData ? 'Uredi teret' : 'Dodaj novi teret'}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div><label className="block font-semibold mb-1">Naslov</label><input className="w-full border rounded px-3 py-2" value={form.title} onChange={e => handleChange('title', e.target.value)}/></div>
          <div><label className="block font-semibold mb-1">Opis</label><textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={form.description} onChange={e => handleChange('description', e.target.value)}/></div>

          {/* Pickup */}
          <div className="border rounded p-4 space-y-3">
            <h6 className="font-semibold text-lg">Lokacija preuzimanja</h6>
            <div className="flex gap-3">
              <Select options={countries} value={form.pickupCountry} onChange={handlePickupCountryChange} placeholder="Država" className="w-1/3"/>
              <Select options={pickupStates} value={form.pickupState} onChange={handlePickupStateChange} placeholder="Regija" className="w-1/3"/>
              <Select options={pickupCities} value={form.pickupCity} onChange={handlePickupCityChange} placeholder="Grad" className="w-1/3"/>
            </div>
            <input className="w-full border rounded p-2 mt-2" placeholder="Adresa preuzimanja" value={form.pickupAddress} onChange={e => handleChange('pickupAddress', e.target.value)}/>
            <div className="h-64 mt-2"><LeafletMap lat={form.pickupLatitude} lng={form.pickupLongitude} onChange={(lat,lng)=>{handleChange('pickupLatitude',lat); handleChange('pickupLongitude',lng)}}/></div>
          </div>

          {/* Delivery */}
          <div className="border rounded p-4 space-y-3">
            <h6 className="font-semibold text-lg">Lokacija isporuke</h6>
            <div className="flex gap-3">
              <Select options={countries} value={form.deliveryCountry} onChange={handleDeliveryCountryChange} placeholder="Država" className="w-1/3"/>
              <Select options={deliveryStates} value={form.deliveryState} onChange={handleDeliveryStateChange} placeholder="Regija" className="w-1/3"/>
              <Select options={deliveryCities} value={form.deliveryCity} onChange={handleDeliveryCityChange} placeholder="Grad" className="w-1/3"/>
            </div>
            <input className="w-full border rounded p-2 mt-2" placeholder="Adresa isporuke" value={form.deliveryAddress} onChange={e => handleChange('deliveryAddress', e.target.value)}/>
            <div className="h-64 mt-2"><LeafletMap lat={form.deliveryLatitude} lng={form.deliveryLongitude} onChange={(lat,lng)=>{handleChange('deliveryLatitude',lat); handleChange('deliveryLongitude',lng)}}/></div>
          </div>

          {/* Cargo */}
          <div className="space-y-3">
            <h6 className="font-semibold text-lg">Detalji o teretu</h6>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <input className="border rounded p-2" placeholder="Težina (kg)" value={form.cargoWeight} onChange={e=>handleChange('cargoWeight',e.target.value)}/>
              <input className="border rounded p-2" placeholder="Širina (m)" value={form.cargoWidth} onChange={e=>handleChange('cargoWidth',e.target.value)}/>
              <input className="border rounded p-2" placeholder="Visina (m)" value={form.cargoHeight} onChange={e=>handleChange('cargoHeight',e.target.value)}/>
              <input className="border rounded p-2" placeholder="Dužina (m)" value={form.cargoLength} onChange={e=>handleChange('cargoLength',e.target.value)}/>
              <input className="border rounded p-2 bg-gray-100" placeholder="Volumen (m³)" value={form.cargoVolume} readOnly/>
              <input className="border rounded p-2 col-span-2 md:col-span-1" placeholder="Cijena (€)" value={form.fixedPrice} onChange={e=>handleChange('fixedPrice',e.target.value)}/>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-3">
            <label className="font-semibold text-lg">Dodaj slike</label>
            <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="border rounded p-2 w-full"/>
            <div className="flex flex-wrap gap-3 mt-3">
              {imagePreviews.map((src,i)=>(
                <div key={i} className="relative">
                  <img src={src} className="w-24 h-24 object-cover rounded border"/>
                  <button type="button" className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center" onClick={()=>removeImage(i)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>Otkaži</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>{initialData?'Ažuriraj teret':'Kreiraj teret'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

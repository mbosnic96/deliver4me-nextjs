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
      // Editing existing load
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
      // New load defaults from user
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
    setIsLoading(true)
    try {
      const jsonData = { ...form }
      ;['pickupCountry', 'pickupState', 'pickupCity', 'deliveryCountry', 'deliveryState', 'deliveryCity'].forEach(f => {
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
      const loadId = result._id || initialData?.id
      if (selectedImages.length > 0) await uploadImages(loadId, selectedImages)

      for (const imageUrl of imagesToRemove) {
        try {
          await fetch(`/api/loads/${loadId}/images`, {
            method: 'DELETE',
            body: JSON.stringify({ imageUrl }),
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (err) {
          console.error('Failed to delete image', imageUrl)
        }
      }
      setImagesToRemove([])

      Swal.fire({ icon: 'success', title: 'Uspjeh', text: 'Teret uspješno sačuvan!', timer: 2000, showConfirmButton: false, customClass: { popup: 'pointer-events-auto' } })
      setIsDirty(false)
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'Greška', text: 'Došlo je do greške prilikom spremanja tereta.', customClass: { popup: 'pointer-events-auto' } })
    } finally {
      setIsLoading(false)
    }
  }

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
      <DialogContent className="overflow-y-auto max-h-[90vh] min-w-[65vw] max-w-[1200px] p-6 content-bg">
        <DialogHeader><DialogTitle>{initialData ? 'Uredi teret' : 'Dodaj novi teret'}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Naslov</label>
            <input className="w-full border rounded px-3 py-2" value={form.title} onChange={e => handleChange('title', e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold mb-1">Opis</label>
            <textarea className="w-full border rounded px-3 py-2 min-h-[100px]" value={form.description} onChange={e => handleChange('description', e.target.value)} />
          </div>

          <div className="border rounded p-4 space-y-3">
            <h6 className="font-semibold text-lg">Lokacija preuzimanja</h6>
            <div className="flex gap-3">
              <Select options={countries} value={form.pickupCountry} onChange={handlePickupCountryChange} placeholder="Država" className="w-1/3" />
              <Select options={pickupStates} value={form.pickupState} onChange={handlePickupStateChange} placeholder="Regija" className="w-1/3" />
              <Select options={pickupCities} value={form.pickupCity} onChange={handlePickupCityChange} placeholder="Grad" className="w-1/3" />
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-2">
              <div className="flex-1">
                <label className="block font-semibold mb-1">Adresa preuzimanja</label>
                <input className="w-full border rounded p-2 h-11" placeholder="Adresa preuzimanja" value={form.pickupAddress} onChange={e => handleChange('pickupAddress', e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Datum i vrijeme preuzimanja</label>
                <Datetime
                  value={form.preferredPickupDate ? new Date(form.preferredPickupDate) : undefined}
                  onChange={(val: any) => handleChange('preferredPickupDate', val instanceof Date ? val.toISOString() : val)}
                  inputProps={{ className: 'w-full border rounded p-2' }}
                />
              </div>
            </div>
            <div className="h-64 mt-2">
              <LeafletMap
                lat={form.pickupLatitude}
                lng={form.pickupLongitude}
                onChange={(lat, lng) => { handleChange('pickupLatitude', lat); handleChange('pickupLongitude', lng) }}
              />
            </div>
          </div>

          <div className="border rounded p-4 space-y-3">
            <h6 className="font-semibold text-lg">Lokacija isporuke</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded p-2" placeholder="Kontakt osoba" value={form.contactPerson} onChange={e => handleChange('contactPerson', e.target.value)} />
              <input className="border rounded p-2" placeholder="Kontakt telefon" value={form.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} />
            </div>
            <div className="flex gap-3 mt-2">
              <Select options={countries} value={form.deliveryCountry} onChange={handleDeliveryCountryChange} placeholder="Država" className="w-1/3" />
              <Select options={deliveryStates} value={form.deliveryState} onChange={handleDeliveryStateChange} placeholder="Regija" className="w-1/3" />
              <Select options={deliveryCities} value={form.deliveryCity} onChange={handleDeliveryCityChange} placeholder="Grad" className="w-1/3" />
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-2">
              <div className="flex-1">
                <label className="block font-semibold mb-1">Adresa isporuke</label>
                <input className="w-full border rounded p-2 h-11" placeholder="Adresa isporuke" value={form.deliveryAddress} onChange={e => handleChange('deliveryAddress', e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1">Datum i vrijeme isporuke</label>
                <Datetime
                  value={form.preferredDeliveryDate ? new Date(form.preferredDeliveryDate) : undefined}
                  onChange={(val: any) => handleChange('preferredDeliveryDate', val instanceof Date ? val.toISOString() : val)}
                  inputProps={{ className: 'w-full border rounded p-2' }}
                />
              </div>
            </div>
            <div className="h-64 mt-2">
              <LeafletMap
                lat={form.deliveryLatitude}
                lng={form.deliveryLongitude}
                onChange={(lat, lng) => { handleChange('deliveryLatitude', lat); handleChange('deliveryLongitude', lng) }}
              />
            </div>
          </div>

          <div className="border rounded p-4 space-y-3">
            <h6 className="font-semibold text-lg">Detalji tereta</h6>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className="border rounded p-2" placeholder="Težina (kg)" value={form.cargoWeight} onChange={e => handleChange('cargoWeight', e.target.value)} />
              <input className="border rounded p-2" placeholder="Širina (m)" value={form.cargoWidth} onChange={e => handleChange('cargoWidth', e.target.value)} />
              <input className="border rounded p-2" placeholder="Visina (m)" value={form.cargoHeight} onChange={e => handleChange('cargoHeight', e.target.value)} />
              <input className="border rounded p-2" placeholder="Dužina (m)" value={form.cargoLength} onChange={e => handleChange('cargoLength', e.target.value)} />
              <input className="border rounded p-2 col-span-2" placeholder="Volumen (m³)" value={form.cargoVolume} readOnly />
              <input className="border rounded p-2 col-span-2" placeholder="Fiksna cijena" value={form.fixedPrice} onChange={e => handleChange('fixedPrice', e.target.value)} />
            </div>
          </div>

          <div className="border rounded p-4 space-y-3">
            <h6 className="font-semibold text-lg">Slike tereta</h6>
            <input type="file" multiple onChange={handleImageSelect} />
            <div className="flex gap-2 flex-wrap mt-2">
              {imagePreviews.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden">
                  <img src={img} className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onClick={() => removeImage(idx)}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">Otkaži</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Spremanje...' : 'Spremi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

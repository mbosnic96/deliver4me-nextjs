
'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Select from 'react-select'
import { getCountries, getStates, getCities, getCityLatLng } from '../../lib/services/CscService'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2'
import Sidebar from '@/components/Sidebar'
import { uploadBase64Image } from '@/lib/file-utils'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ChangeEmailDialog from "@/components/ChangeEmailDialog"
import ChangePasswordDialog from "@/components/ChangePasswordDialog"


type Role = 'client' | 'driver' | 'admin' | undefined
type FormData = {
  name: string
  userName: string
  email: string
  phone: string
  address: string
  country: string
  state: string
  city: string
  postalCode: string
  photoUrl: string | null
  latitude: number | null
  longitude: number | null
}


const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" /> }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)


const PhotoUpload = ({ photoUrl, onRemove, onChange }: {
  photoUrl: string | null
  onRemove: () => void
  onChange: (fileUrl: string) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    if (file.size > 10 * 1024 * 1024) { 
      toast.error('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        onChange(result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center ">
      <div className="mb-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Profile"
            className="w-64 h-64 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-64 h-64 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
            <img
              src="/user.png"
              alt="User"
              className="w-16 h-16 opacity-50 dark:opacity-30"
            />
          </div>
        )}
      </div>
      {photoUrl ? (
        <button
          type="button"
          onClick={onRemove}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Remove photo
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer"
          >
            Add photo
          </button>
          <Input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </>
      )}
    </div>
  )
}

const LocationMap = ({ 
  latitude, 
  longitude,
  onMarkerDragEnd,
  markerRef,
  mapRef
}: {
  latitude: number | null
  longitude: number | null
  onMarkerDragEnd: () => void
  markerRef: React.RefObject<any>
  mapRef: React.RefObject<any>
}) => {
  const hasValidCoords = latitude && longitude && !isNaN(latitude) && !isNaN(longitude)
  
  return (
    <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
      {hasValidCoords ? (
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker
            position={[latitude, longitude]}
            draggable={true}
            eventHandlers={{ dragend: onMarkerDragEnd }}
            ref={markerRef}
          />
        </MapContainer>
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            {latitude === null || longitude === null 
              ? "Select a city to view location" 
              : "Loading map..."}
          </p>
        </div>
      )}
    </div>
  )
}

export default function AccountSettings() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [selectedStates, setSelectedStates] = useState<any[]>([])
  const [selectedCities, setSelectedCities] = useState<any[]>([])
  const [mapInitialized, setMapInitialized] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const markerRef = useRef<any>(null)
const mapRef = useRef<any>(null)
 const [open, setOpen] = useState(false)
 const [openPassword, setOpenPassword] = useState(false)



  

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<FormData>({
    defaultValues: {
      photoUrl: null,
      latitude: null,
      longitude: null
    }
  })

  const role = session?.user?.role as Role
  const photoUrl = watch('photoUrl')
  const country = watch('country')
  const state = watch('state')
  const city = watch('city')
  const latitude = watch('latitude')
  const longitude = watch('longitude')


  const countryOptions = useMemo(() => getCountries(), [])


  const loadUserData = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const res = await fetch('/api/users/me')
      if (!res.ok) throw new Error('Failed to load user')
      const user = await res.json()
     console.log('User data:', user)
      
      reset({
        name: user.name,
        userName: user.userName,
        email: user.email,
        phone: user.phone,
        address: user.address || '',
        country: user.country || '',
        state: user.state || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        photoUrl: user.photoUrl || null,
        latitude: user.latitude || null,
        longitude: user.longitude || null,
      })

      if (user.country) {
        setSelectedStates(getStates(user.country))
        if (user.state) {
          setSelectedCities(getCities(user.country, user.state))
        }
      }

      if (user.latitude && user.longitude) {
        setMapInitialized(true)
      }
    } catch (error) {
      console.error('Failed to load user data', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, reset])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  useEffect(() => {
    if (!country) return
    
    setLoadingStates(true)
    const timer = setTimeout(() => {
      const countryStates = getStates(country)
      setSelectedStates(countryStates)
      if(!state){
      setValue('state', '', { shouldDirty: true })
      setValue('city', '', { shouldDirty: true })
      }
      setSelectedCities([])
      setLoadingStates(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [country, setValue])


  useEffect(() => {
    if (!country || !state) return
    
    setLoadingCities(true)
    const timer = setTimeout(() => {
      const countryCities = getCities(country, state)
      setSelectedCities(countryCities)
      if(!city){
        setValue('city', '', { shouldDirty: true })
      }
      setLoadingCities(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [state, country, setValue])

  useEffect(() => {
    if (!city || !country || !state || latitude || longitude) return
    updateMapWithCity()
  }, [city, country, state, latitude, longitude])

const updateMapWithCity = useCallback(async () => {
  if (!city || !country || !state) return

  try {
    setLoading(true)
    const coords = await getCityLatLng(city, country, state)
    if (coords && !isNaN(coords.lat) && !isNaN(coords.lng)) {
      setValue('latitude', coords.lat, { shouldDirty: true })
      setValue('longitude', coords.lng, { shouldDirty: true })
      setMapInitialized(true)
    } else {
      toast.error('Invalid coordinates received for this city')
    }
  } catch (error) {
    console.error('Failed to get city coordinates', error)
    toast.error('Failed to get location data for this city')
  } finally {
    setLoading(false)
  }
}, [city, country, state, setValue])

  const handleFileUpload = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload image')
      return null
    }
  }, [])

const handleFileChange = useCallback(async (base64Data: string) => {
  try {
    setLoading(true)
    const fileUrl = await uploadBase64Image(base64Data, 'profile')
    if (fileUrl) {
      setValue('photoUrl', fileUrl, { shouldDirty: true })
    }
  } catch (error) {
    console.error('Upload failed:', error)
    toast.error('Failed to upload image')
  } finally {
    setLoading(false)
  }
}, [setValue])

  const removePhoto = useCallback(() => {
    setValue('photoUrl', null, { shouldDirty: true })
  }, [setValue])

const onSubmit = useCallback(async (data: FormData) => {
  if (!isDirty || !session?.user?.id) return;
  setLoading(true);
  try {
    const res = await fetch(`/api/users/${session.user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    toast.success('Profile updated successfully');
    reset(data);
  } catch (error) {
    console.error('Failed to update profile', error);
    toast.error('Failed to update profile');
  } finally {
    setLoading(false);
  }
}, [isDirty, reset, session?.user?.id]);


const requestAccountDeletion = useCallback(async () => {
  if (!session?.user?.id) return;

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will permanently delete your account!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Delete account',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete account');
      Swal.fire('Deleted!', 'Your account has been deleted.', 'success');
    } catch (error) {
      console.error('Failed to delete account', error);
      Swal.fire('Error', 'Failed to delete account', 'error');
    } finally {
      setLoading(false);
    }
  }
}, [session?.user?.id]);


const updatePositionOnly = useCallback(async () => {
  if (!latitude || !longitude || !session?.user?.id) {
    toast.error('Please select a location first');
    return;
  }
  setLoading(true);
  try {
    const res = await fetch(`/api/users/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude })
    });
    if (!res.ok) throw new Error('Failed to update location');
    toast.success('Location updated successfully');
  } catch (error) {
    console.error('Failed to update location', error);
    toast.error('Failed to update location');
  } finally {
    setLoading(false);
  }
}, [latitude, longitude, session?.user?.id]);


  const handleMarkerDragEnd = useCallback(() => {
  if (markerRef.current) {
    try {
      const marker = markerRef.current
      const latLng = marker.getLatLng()
      setValue('latitude', latLng.lat, { shouldDirty: true })
      setValue('longitude', latLng.lng, { shouldDirty: true })
    } catch (error) {
      console.error('Error handling marker drag:', error)
    }
  }
}, [setValue])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        role={role}
        navbarHeight={84}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-4 md:p-6">
          <div className="container mx-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <section className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Profile</h2>
                
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <div className="w-full lg:w-1/3">
                  <PhotoUpload 
  photoUrl={photoUrl}
  onRemove={removePhoto}
  onChange={handleFileChange}
/>
                  </div>

                  <div className="w-full lg:w-2/3 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full name
                      </label>
                      <Input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        {...register('name', { required: 'Name is required' })}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                      </label>
                      <Input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        {...register('userName', { required: 'Username is required' })}
                      />
                      {errors.userName && (
                        <p className="mt-1 text-sm text-red-600">{errors.userName.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Country
                        </label>
                        <Select
                          options={countryOptions}
                          value={countryOptions.find((c) => c.value === country)}
                          onChange={(selected) =>
                            setValue('country', selected?.value || '', { shouldDirty: true })
                          }
                          placeholder="Select country"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          instanceId="country-select"
                          isLoading={!countryOptions.length}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          State/Region
                        </label>
                        <Select
                          options={selectedStates}
                          value={selectedStates.find((s) => s.value === state)}
                          onChange={(selected) =>
                            setValue('state', selected?.value || '', { shouldDirty: true })
                          }
                          placeholder="Select state"
                          isDisabled={!country}
                          isLoading={loadingStates}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          instanceId="state-select"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City
                        </label>
                        <Select
                          options={selectedCities}
                          value={selectedCities.find((c) => c.value === city)}
                          onChange={(selected) =>
                            setValue('city', selected?.value || '', { shouldDirty: true })
                          }
                          placeholder="Select city"
                          isDisabled={!state}
                          isLoading={loadingCities}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          instanceId="city-select"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Postal code
                        </label>
                        <Input
                          type="text"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                          {...register('postalCode')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address
                      </label>
                      <Input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        {...register('address')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <Input
                        type="text"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        {...register('phone', { required: 'Phone is required' })}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={!isDirty || loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Location</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Drag the marker to your exact location to help delivery personnel find you.
                </p>

               <LocationMap 
  latitude={latitude} 
  longitude={longitude} 
  onMarkerDragEnd={handleMarkerDragEnd}
  markerRef={markerRef}
  mapRef={mapRef}
/>

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={updatePositionOnly}
                    disabled={!latitude || !longitude || loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Location'}
                  </button>
                </div>
              </section>

              <section className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Account Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Email address</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">{watch('email')}</span>
                       <Button  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" onClick={() => setOpen(true)}>Change Email</Button>
      <ChangeEmailDialog open={open} onOpenChange={setOpen} currentEmail={watch('email')}/>
                     
                    </div>
                  </div>

                  <div>
  <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Password</h4>
  <div className="flex justify-between items-center">
    <span className="text-gray-600 dark:text-gray-400">••••••••</span>
    <Button 
      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
      onClick={() => setOpenPassword(true)}
    >
      Change Password
    </Button>
    <ChangePasswordDialog open={openPassword} onOpenChange={setOpenPassword} />
  </div>
</div>

                </div>
              </section>

             
              {role !== 'admin' && (
                <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-red-500">
                  <h3 className="text-xl font-bold mb-4 text-red-500">Danger Zone</h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    This will permanently delete your account and all associated data.
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={requestAccountDeletion}
                      disabled={loading}
                      className="px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition dark:hover:bg-red-900/20"
                    >
                      Delete Account
                    </button>
                  </div>
                </section>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
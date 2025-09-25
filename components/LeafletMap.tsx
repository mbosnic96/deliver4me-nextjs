'use client'

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import '../node_modules/leaflet/dist/leaflet.css'

let L: any = null

const createMarkerIcon = () => {
  if (!L) return null
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

export function LeafletMap({
  lat,
  lng,
  onChange,
  className = 'h-full w-full',
  zoom = 13
}: {
  lat?: number
  lng?: number
  onChange?: (lat: number, lng: number) => void
  className?: string
  zoom?: number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const [isClient, setIsClient] = useState(false)

  const tileLayerConfig = useMemo(() => ({
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }
  }), [])

  const handleMarkerDragEnd = useCallback((e: L.DragEndEvent) => {
    const { lat, lng } = e.target.getLatLng()
    onChange?.(lat, lng)
  }, [onChange])

  const initMap = useCallback(async () => {
    if (!mapRef.current || lat === undefined || lng === undefined || !isClient) return

    
    if (typeof window !== 'undefined') {
      L = await import('leaflet')
      
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
    }

    if (!mapInstance.current && L) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        preferCanvas: true
      }).setView([lat, lng], zoom)

      tileLayerRef.current = L.tileLayer(
        tileLayerConfig.url,
        tileLayerConfig.options
      ).addTo(mapInstance.current)

      markerRef.current = L.marker([lat, lng], {
        draggable: !!onChange,
        icon: createMarkerIcon()
      })
        .addTo(mapInstance.current)
        .on('dragend', handleMarkerDragEnd)

      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current)
    }
  }, [lat, lng, zoom, tileLayerConfig, onChange, handleMarkerDragEnd, isClient])

  const updateMapPosition = useCallback(() => {
    if (lat === undefined || lng === undefined || !L) return
    
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    }
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], mapInstance.current.getZoom())
    }
  }, [lat, lng])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      initMap()
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        markerRef.current = null
        tileLayerRef.current = null
      }
    }
  }, [initMap, isClient])

  useEffect(() => {
    if (isClient) {
      updateMapPosition()
    }
  }, [updateMapPosition, isClient])

  if (!isClient) {
    return (
      <div className={className + " flex items-center justify-center bg-gray-100"}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      aria-label="Interactive map"
      role="application"
    />
  )
}
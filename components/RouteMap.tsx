'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'


delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface RouteMapProps {
  pickup: { lat: number; lng: number; address?: string }
  delivery: { lat: number; lng: number; address?: string }
  className?: string
  zoom?: number
}

export function RouteMap({
  pickup,
  delivery,
  className = 'h-full w-full',
  zoom = 13
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const routingControlRef = useRef<L.Routing.Control | null>(null)

  const createCustomIcon = (color: string, label?: string) => {
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 14px;
          ">${label || ''}</div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    })
  }

  const initMap = useCallback(() => {
    if (!mapRef.current) return

    const centerLat = (pickup.lat + delivery.lat) / 2
    const centerLng = (pickup.lng + delivery.lng) / 2

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([centerLat, centerLng], zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current)

      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current)
    }

    if (routingControlRef.current) {
      mapInstance.current.removeControl(routingControlRef.current)
    }

    routingControlRef.current = (L.Routing.control as any)({
      waypoints: [
        L.latLng(pickup.lat, pickup.lng),
        L.latLng(delivery.lat, delivery.lng),
      ],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#3B82F6', opacity: 0.8, weight: 5 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      createMarker: (i: number, waypoint: L.Routing.Waypoint) => {
        if (i === 0) return L.marker(waypoint.latLng, { icon: createCustomIcon('#EF4444', 'P') })
        return L.marker(waypoint.latLng, { icon: createCustomIcon('#10B981', 'D') })
      }
    })

    routingControlRef.current?.addTo(mapInstance.current)

    
    setTimeout(() => {
      if (!mapInstance.current) return
      L.popup()
        .setLatLng([pickup.lat, pickup.lng])
        .setContent(`<strong>Pickup</strong><br>${pickup.address || ''}`)
        .openOn(mapInstance.current)
      L.popup()
        .setLatLng([delivery.lat, delivery.lng])
        .setContent(`<strong>Delivery</strong><br>${delivery.address || ''}`)
        .openOn(mapInstance.current)
    }, 500)
  }, [pickup, delivery, zoom])

  useEffect(() => {
    initMap()
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        routingControlRef.current = null
      }
    }
  }, [initMap])

  return <div ref={mapRef} className={className} role="application" aria-label="Route map" />
}

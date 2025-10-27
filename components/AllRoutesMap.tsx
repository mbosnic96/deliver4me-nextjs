'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

// Fix Leaflet icon URLs
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export interface Load {
  id: string
  title: string
  pickup: { lat: number; lng: number; address?: string }
  delivery: { lat: number; lng: number; address?: string }
}

interface AllRoutesMapProps {
  loads: Load[]
  className?: string
  zoom?: number
}

export function AllRoutesMap({
  loads,
  className = 'h-full w-full',
  zoom = 10
}: AllRoutesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const routingControlsRef = useRef<L.Routing.Control[]>([])

  // Generate unique color for each route
  const getRouteColor = (index: number): string => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ]
    return colors[index % colors.length]
  }

  // Custom marker icon
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

    // Initialize map once
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([0, 0], zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current)

      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current)
    }

    // Remove old routes
    routingControlsRef.current.forEach(control => {
      if (mapInstance.current && control) mapInstance.current.removeControl(control)
    })
    routingControlsRef.current = []

    const bounds = L.latLngBounds([])
    const validLoads = loads.filter(load =>
      load.pickup.lat && load.pickup.lng && load.delivery.lat && load.delivery.lng &&
      !isNaN(load.pickup.lat) && !isNaN(load.pickup.lng) &&
      !isNaN(load.delivery.lat) && !isNaN(load.delivery.lng)
    )

    validLoads.forEach((load, index) => {
      const pickupLatLng = L.latLng(load.pickup.lat, load.pickup.lng)
      const deliveryLatLng = L.latLng(load.delivery.lat, load.delivery.lng)

      const control = (L.Routing.control as any)({
        waypoints: [pickupLatLng, deliveryLatLng],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        fitSelectedRoutes: false,
        lineOptions: {
          styles: [{ color: getRouteColor(index), opacity: 0.8, weight: 5 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        createMarker: (i: number, wp: L.Routing.Waypoint) => {
          if (i === 0) {
            return L.marker(wp.latLng, {
              icon: createCustomIcon('#EF4444', 'P'),
            }).bindPopup(`
              <strong>${load.title}</strong><br>
              Pickup: ${load.pickup.address || ''}
            `)
          } else {
            return L.marker(wp.latLng, {
              icon: createCustomIcon('#10B981', 'D'),
            }).bindPopup(`
              <strong>${load.title}</strong><br>
              Delivery: ${load.delivery.address || ''}
            `)
          }
        }
      })

      control.on('routesfound', (e: any) => {
        const summary = e.routes[0].summary
        console.log(
          `Route ${index} (${load.id}): ${(summary.totalDistance / 1000).toFixed(1)} km, ${Math.round(summary.totalTime / 60)} min`
        )
      })

      control.on('routingerror', () => {
        console.warn(`Routing failed for load ${load.id}, skipping.`)
      })

      control.addTo(mapInstance.current!)
      routingControlsRef.current.push(control)

      bounds.extend(pickupLatLng)
      bounds.extend(deliveryLatLng)
    })

    if (bounds.isValid()) {
      setTimeout(() => {
        mapInstance.current?.fitBounds(bounds, { padding: [50, 50] })
      }, 1000)
    } else {
      mapInstance.current?.setView([45.815, 15.981], zoom)
    }
  }, [loads, zoom])

  useEffect(() => {
    initMap()
    return () => {
      routingControlsRef.current.forEach(control => {
        if (mapInstance.current && control) {
          mapInstance.current.removeControl(control)
        }
      })
      routingControlsRef.current = []

      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [initMap])

  return <div ref={mapRef} className={className} role="application" aria-label="All routes map" />
}

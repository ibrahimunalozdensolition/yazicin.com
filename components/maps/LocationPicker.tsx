"use client"

import { useState, useCallback, useEffect } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"
import { MapPin, Navigation } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const containerStyle = {
  width: "100%",
  height: "400px",
}

const defaultCenter = {
  lat: 39.9334,
  lng: 32.8597,
}

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"]

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }, addressInfo?: { city: string; district: string }) => void
  selectedLocation?: { lat: number; lng: number } | null
  error?: string
  disabled?: boolean
  city?: string
  district?: string
}

export default function LocationPicker({
  onLocationSelect,
  selectedLocation,
  error,
  disabled = false,
  city,
  district,
}: LocationPickerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    selectedLocation || null
  )
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCIXrdVbTGbtUtI-pcOoQORcbBB0SQe-ww"

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  })

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!isLoaded) return null

      setIsReverseGeocoding(true)
      try {
        const geocoder = new google.maps.Geocoder()
        const latlng = { lat, lng }

        return new Promise<{ city: string; district: string } | null>((resolve) => {
          geocoder.geocode({ location: latlng, region: "tr" }, (results, status) => {
            setIsReverseGeocoding(false)
            if (status === "OK" && results && results.length > 0) {
              let city = ""
              let district = ""

              for (const result of results) {
                for (const component of result.address_components) {
                  const types = component.types

                  if (types.includes("administrative_area_level_1") && !city) {
                    city = component.long_name
                  } else if (types.includes("administrative_area_level_2") && !district) {
                    district = component.long_name
                  } else if (types.includes("sublocality_level_1") && !district) {
                    district = component.long_name
                  } else if (types.includes("locality") && !district && !types.includes("administrative_area_level_1")) {
                    district = component.long_name
                  }
                }

                if (city && district) break
              }

              if (city && district) {
                resolve({ city, district })
              } else if (city) {
                resolve({ city, district: "" })
              } else {
                resolve(null)
              }
            } else {
              resolve(null)
            }
          })
        })
      } catch (error) {
        setIsReverseGeocoding(false)
        return null
      }
    },
    [isLoaded]
  )

  const onMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (disabled || !e.latLng) return

      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      const location = { lat, lng }

      setMarkerPosition(location)
      
      const addressInfo = await reverseGeocode(lat, lng)
      onLocationSelect(location, addressInfo || undefined)
    },
    [disabled, onLocationSelect, reverseGeocode]
  )

  const onMarkerDragEnd = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (disabled || !e.latLng) return

      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      const location = { lat, lng }

      setMarkerPosition(location)
      
      const addressInfo = await reverseGeocode(lat, lng)
      onLocationSelect(location, addressInfo || undefined)
    },
    [disabled, onLocationSelect, reverseGeocode]
  )

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      setMarkerPosition(selectedLocation)
    }
  }, [selectedLocation])

  const geocodeLocation = useCallback(async () => {
    if (!isLoaded || !map || !city || !district) return

    setIsGeocoding(true)
    try {
      const geocoder = new google.maps.Geocoder()
      const address = `${district}, ${city}, Türkiye`

      geocoder.geocode({ address }, (results, status) => {
        setIsGeocoding(false)
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location
          const lat = location.lat()
          const lng = location.lng()
          const newLocation = { lat, lng }

          setMarkerPosition(newLocation)
          onLocationSelect(newLocation)

          map.setCenter(newLocation)
          map.setZoom(14)
        }
      })
    } catch (error) {
      setIsGeocoding(false)
    }
  }, [city, district, isLoaded, map, onLocationSelect])

  if (loadError) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border-2 border-destructive/50 bg-destructive/5">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-destructive">Harita yüklenemedi</p>
          <p className="text-xs text-muted-foreground">Lütfen sayfayı yenileyin</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border-2 border-border/50 bg-muted/20">
        <div className="text-center space-y-2">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Harita yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Konum Seçiniz *
        </Label>
        {city && district && (
          <Button
            type="button"
            onClick={geocodeLocation}
            disabled={disabled || isGeocoding || !isLoaded || !map}
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
          >
            {isGeocoding ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Aranıyor...
              </>
            ) : (
              <>
                <Navigation className="h-3 w-3" />
                Yaklaşık Konumu Getir
              </>
            )}
          </Button>
        )}
      </div>
      <div className="relative rounded-xl overflow-hidden border-2 border-border/50">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={markerPosition || defaultCenter}
          zoom={markerPosition ? 15 : 6}
          onClick={onMapClick}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={!disabled}
              onDragEnd={onMarkerDragEnd}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
        {!disabled && (
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg">
            {isGeocoding || isReverseGeocoding ? (
              <p className="text-xs font-medium text-foreground">Konum aranıyor...</p>
            ) : (
              <>
                <p className="text-xs font-medium text-foreground">Haritaya tıklayarak konum seçin</p>
                <p className="text-xs text-muted-foreground">veya pin'i sürükleyin</p>
              </>
            )}
          </div>
        )}
      </div>
      {markerPosition && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <span className="font-medium">Seçilen konum: </span>
          {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
        </div>
      )}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  )
}


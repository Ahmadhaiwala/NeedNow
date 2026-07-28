'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2, Info } from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  lat: number | null;
  lng: number | null;
  placeholder?: string;
  radius?: number; // Optional radius in km to draw a circle on Google Maps
}

export default function LocationPicker({
  value,
  onChange,
  lat,
  lng,
  placeholder = 'Search for address or neighborhood...',
  radius,
}: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [osmError, setOsmError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const numLat = lat !== null && lat !== undefined ? parseFloat(String(lat)) : 0;
  const numLng = lng !== null && lng !== undefined ? parseFloat(String(lng)) : 0;
  const hasValidCoords = !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0;

  // ── 1. Load Google Maps Script ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gm_authFailure = () => {
        console.warn('Google Maps billing / API key notice. Utilizing OpenStreetMap fallback engine.');
        setLoadError(true);
      };
    }

    if (!apiKey) {
      // No Google Maps key, we will use OpenStreetMap fallback
      return;
    }

    if (window.google?.maps) {
      setIsGoogleLoaded(true);
      return;
    }

    // Check if script already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleLoaded(true);
    script.onerror = () => {
      console.warn('Google Maps failed to load. Falling back to OpenStreetMap.');
      setLoadError(true);
    };

    document.head.appendChild(script);
  }, [apiKey]);

  // ── 2. Initialize Google Map and Autocomplete ──
  useEffect(() => {
    if (!isGoogleLoaded || !window.google?.maps || !inputRef.current) return;

    try {
      // A. Init Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry || !place.geometry.location) {
          console.warn('Autocomplete place has no geometry.');
          return;
        }

        const selectedLat = place.geometry.location.lat();
        const selectedLng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name || '';

        // Round to 6 decimal places (Django compatibility)
        const roundedLat = parseFloat(selectedLat.toFixed(6));
        const roundedLng = parseFloat(selectedLng.toFixed(6));

        onChange(formattedAddress, roundedLat, roundedLng);
      });
    } catch (e) {
      console.warn('Google Autocomplete initialization notice. Falling back to OpenStreetMap search.');
    }

    // B. Init Map if container exists
    if (mapRef.current) {
      const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 }; // Default center (Ahmedabad/India region)
      const initialPosition = hasValidCoords ? { lat: numLat, lng: numLng } : DEFAULT_CENTER;

      // Create map
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: initialPosition,
        zoom: hasValidCoords ? 15 : 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Create draggable marker if coordinates exist or for initial selection
      markerRef.current = new window.google.maps.Marker({
        position: initialPosition,
        map: googleMapRef.current,
        draggable: true,
        title: 'Your Location',
        visible: hasValidCoords, // only show marker when valid location is picked
      });

      // Dragend listener
      markerRef.current.addListener('dragend', () => {
        const nextPos = markerRef.current.getPosition();
        if (nextPos) {
          const dragLat = parseFloat(nextPos.lat().toFixed(6));
          const dragLng = parseFloat(nextPos.lng().toFixed(6));
          
          // Geocode coordinates back to address text (reverse geocoding)
          reverseGeocode(dragLat, dragLng);
        }
      });

      // Draw Radius Circle if specified and coords valid
      if (radius && hasValidCoords) {
        circleRef.current = new window.google.maps.Circle({
          strokeColor: '#CACE00',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#CACE00',
          fillOpacity: 0.15,
          map: googleMapRef.current,
          center: initialPosition,
          radius: radius * 1000, // km to meters
        });
      }
    }
  }, [isGoogleLoaded, numLat, numLng, radius]);

  // Reverse Geocoding Helper with OpenStreetMap Fallback
  const reverseGeocode = async (targetLat: number, targetLng: number) => {
    if (isGoogleLoaded && window.google?.maps) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: targetLat, lng: targetLng } }, async (results, status) => {
          if (status === 'OK' && results && results[0]) {
            onChange(results[0].formatted_address, targetLat, targetLng);
            return;
          }
          fetchOSMReverse(targetLat, targetLng);
        });
        return;
      } catch (e) {
        // Fallback to OSM
      }
    }
    fetchOSMReverse(targetLat, targetLng);
  };

  const fetchOSMReverse = async (targetLat: number, targetLng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          onChange(data.display_name, targetLat, targetLng);
          return;
        }
      }
    } catch (e) {}
    onChange(`Location (${targetLat}, ${targetLng})`, targetLat, targetLng);
  };

  // Update map marker when props change (coordinates modified elsewhere)
  useEffect(() => {
    if (isGoogleLoaded && googleMapRef.current && hasValidCoords) {
      const position = { lat: numLat, lng: numLng };
      googleMapRef.current.setCenter(position);
      googleMapRef.current.setZoom(15);
      
      if (markerRef.current) {
        markerRef.current.setPosition(position);
        markerRef.current.setVisible(true);
      }
      if (circleRef.current) {
        circleRef.current.setCenter(position);
        if (radius) circleRef.current.setRadius(radius * 1000);
      }
    }
  }, [numLat, numLng, radius, isGoogleLoaded]);



  // ── 3. OpenStreetMap Fallback Search (Nominatim) ──
  const handleOSMVerify = async () => {
    if (!value.trim()) return;
    
    setIsGeocoding(true);
    setOsmError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=1`
      );
      if (response.ok) {
        const results = await response.json();
        if (results && results.length > 0) {
          const parsedLat = parseFloat(parseFloat(results[0].lat).toFixed(6));
          const parsedLng = parseFloat(parseFloat(results[0].lon).toFixed(6));
          onChange(results[0].display_name, parsedLat, parsedLng);
        } else {
          setOsmError('Address not found. Please try a different search.');
        }
      } else {
        throw new Error('OSM request failed');
      }
    } catch (err) {
      console.error('OSM Geocoding error:', err);
      setOsmError('Could not verify location. Try adding city/state.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Universal Search / Geocode handler (works with Google Geocoder & OSM)
  const handleUniversalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim()) return;

    setIsGeocoding(true);
    setOsmError(null);

    // 1. Try Google Geocoder if loaded
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: value }, (results, status) => {
          setIsGeocoding(false);
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location;
            const gLat = parseFloat(loc.lat().toFixed(6));
            const gLng = parseFloat(loc.lng().toFixed(6));
            onChange(results[0].formatted_address, gLat, gLng);
          } else {
            // Fallback to OSM
            handleOSMVerify();
          }
        });
        return;
      } catch (err) {
        console.warn('Google Geocoder failed, falling back to OSM:', err);
      }
    }

    // 2. Fallback to OpenStreetMap
    handleOSMVerify();
  };

  // ── RENDER ──
  const useOSMFallback = !apiKey || loadError;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Input bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value, lat || 0, lng || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUniversalSearch();
                }
              }}
              className="w-full pl-11 pr-4 py-4 text-sm bg-[var(--bg-page)] text-[var(--text-primary)] rounded-[var(--radius-md)] border-0 focus:ring-2 focus:ring-[var(--color-juice)] outline-none"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
              <MapPin size={18} />
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleUniversalSearch}
            disabled={isGeocoding || !value.trim()}
            className="px-5 py-2 text-sm font-semibold rounded-[var(--radius-md)] border border-[rgba(31,54,53,0.15)] bg-[var(--bg-surface)] hover:bg-[rgba(31,54,53,0.05)] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 text-[var(--text-primary)]"
          >
            {isGeocoding ? (
              <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
            ) : (
              'Verify'
            )}
          </button>
        </div>

        {/* OSM Specific Error */}
        {useOSMFallback && osmError && (
          <p className="text-xs text-[var(--color-heat)] font-medium mt-1.5 flex items-center gap-1">
            <Info size={12} />
            {osmError}
          </p>
        )}
      </div>

      {/* Google Interactive Map */}
      {!useOSMFallback && lat !== null && lng !== null && (
        <div className="flex flex-col gap-1">
          <div 
            ref={mapRef}
            className="w-full h-[160px] rounded-[var(--radius-lg)] border border-[rgba(31,54,53,0.08)] overflow-hidden shadow-sm"
          />
          <p className="text-[10px] text-[var(--text-secondary)] italic mt-1 text-center">
            📍 You can drag the red map pin to adjust your neighborhood coordinates.
          </p>
        </div>
      )}

      {/* Coordinates status pill */}
      {hasValidCoords && (
        <div className="self-start px-3 py-1.5 bg-[rgba(2,90,92,0.08)] rounded-[var(--radius-sm)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-jade)] animate-pulse" />
          <span className="text-[10px] text-[var(--color-jade)] font-bold tracking-wide uppercase">
            Coordinates: {numLat.toFixed(6)}, {numLng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}

// Minimal styling config for dark mode Google Map rendering
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3931" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from './ui/card';

interface Location {
  lat: number;
  lng: number;
  label?: string;
}

interface GPSMapProps {
  pickup?: Location;
  dropoff?: Location;
  currentLocation?: Location;
  showRoute?: boolean;
}

export default function GPSMap({ pickup, dropoff, currentLocation, showRoute = false }: GPSMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);

  // Mock map implementation - in production, integrate with Mapbox/Google Maps
  useEffect(() => {
    // Placeholder for actual map initialization
    // Will be replaced with real map SDK when Mapbox key is available
  }, [pickup, dropoff, currentLocation, showRoute]);

  if (mapError) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Map temporarily unavailable</p>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-muted rounded-lg overflow-hidden">
      <div ref={mapRef} className="absolute inset-0">
        {/* Mock map visualization */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <MapPin className="h-16 w-16 mx-auto text-primary animate-bounce" />
            <div className="space-y-2">
              {pickup && (
                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 border">
                  <p className="text-sm font-medium">Pickup: {pickup.label || 'Vendor Location'}</p>
                </div>
              )}
              {currentLocation && (
                <div className="bg-primary/90 backdrop-blur-sm rounded-lg p-3 border border-primary">
                  <p className="text-sm font-medium text-primary-foreground">
                    Current Location: {currentLocation.label || 'In Transit'}
                  </p>
                </div>
              )}
              {dropoff && (
                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 border">
                  <p className="text-sm font-medium">Dropoff: {dropoff.label || 'Delivery Location'}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">GPS Tracking Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
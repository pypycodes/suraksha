import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Shield, 
  Ambulance, 
  Droplets, 
  Navigation, 
  Phone,
  Crosshair,
  Map as MapIcon,
  Stethoscope,
  Pill,
  Loader2
} from 'lucide-react';
import { SafetyMap } from './SafetyMap';
import { cn } from '../lib/utils';

interface POI {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: string;
  distance?: number;
}

const RESOURCE_TYPES = [
  { id: 'police', label: 'Police', icon: Shield, color: 'bg-blue-500', tags: '["amenity"="police"]' },
  { id: 'hospital', label: 'Hospital', icon: Stethoscope, color: 'bg-red-500', tags: '["amenity"~"hospital|clinic"]' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, color: 'bg-green-500', tags: '["amenity"="pharmacy"]' },
  { id: 'fuel', label: 'Petrol', icon: Droplets, color: 'bg-amber-500', tags: '["amenity"="fuel"]' },
];

export const NearMe: React.FC<{ currentPos: { lat: number, lng: number } }> = ({ currentPos }) => {
  const [activeType, setActiveType] = useState(RESOURCE_TYPES[0]);
  const [results, setResults] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async (type: typeof RESOURCE_TYPES[0]) => {
    setLoading(true);
    setError(null);
    
    // Overpass API Query
    const query = `
      [out:json][timeout:25];
      (
        node${type.tags}(around:5000, ${currentPos.lat}, ${currentPos.lng});
        way${type.tags}(around:5000, ${currentPos.lat}, ${currentPos.lng});
      );
      out center;
    `;

    try {
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      const pois = data.elements.map((el: any) => ({
        id: el.id,
        lat: el.lat || el.center.lat,
        lon: el.lon || el.center.lon,
        name: el.tags.name || `Unnamed ${type.label}`,
        type: type.id
      }));

      // Sort by distance
      pois.sort((a: POI, b: POI) => {
        const distA = Math.sqrt(Math.pow(a.lat - currentPos.lat, 2) + Math.pow(a.lon - currentPos.lng, 2));
        const distB = Math.sqrt(Math.pow(b.lat - currentPos.lat, 2) + Math.pow(b.lon - currentPos.lng, 2));
        return distA - distB;
      });

      setResults(pois.slice(0, 10));
    } catch (err) {
      setError('Failed to fetch nearby resources. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [currentPos]);

  useEffect(() => {
    fetchResources(activeType);
  }, [activeType, fetchResources]);

  const handleNavigate = (poi: POI) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lon}`, '_blank');
  };

  return (
    <div className="px-6 space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Safe Resources Near You</h2>
        {loading && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />}
      </div>

      {/* Category Toggles */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {RESOURCE_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = activeType.id === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap",
                isActive 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-md scale-105" 
                  : "bg-white border-zinc-100 text-zinc-500 hover:bg-zinc-50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results View */}
      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-lg p-2 overflow-hidden">
          <SafetyMap 
            center={currentPos} 
            className="h-48 rounded-[24px]" 
            markers={[
              { id: 'me', position: currentPos, label: 'Me' },
              ...results.map(r => ({ id: r.id.toString(), position: { lat: r.lat, lng: r.lon }, label: r.name }))
            ]}
            zoom={14}
          />
        </div>

        <div className="grid gap-3">
          {error && <p className="text-xs text-red-500 text-center py-4">{error}</p>}
          {!loading && results.length === 0 && (
            <div className="text-center py-12 bg-zinc-100 rounded-3xl border border-dashed border-zinc-200">
              <Search className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No results found within 5km</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {results.map((poi, idx) => (
              <motion.div
                key={poi.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", activeType.color)}>
                    <activeType.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 truncate max-w-[150px]">{poi.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">{activeType.label}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleNavigate(poi)}
                  className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Navigation className="w-3 h-3" /> Navigate
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="p-4 bg-zinc-900 rounded-3xl text-white relative overflow-hidden">
        <div className="relative z-10 flex gap-4 items-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
            <Ambulance className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Need an Ambulance?</h4>
            <p className="text-[10px] text-zinc-400">Find 24/7 medical response teams nearby</p>
          </div>
          <button 
            onClick={() => window.location.href = 'tel:102'}
            className="ml-auto w-10 h-10 bg-red-600 rounded-full flex items-center justify-center active:scale-95"
          >
            <Phone className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

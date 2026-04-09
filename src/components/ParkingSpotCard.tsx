import { ParkingSpot } from '../lib/supabase';
import { Car, CheckCircle } from 'lucide-react';

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  onToggle: (spotId: string, currentStatus: boolean) => void;
}

export function ParkingSpotCard({ spot, onToggle }: ParkingSpotCardProps) {
  return (
    <button
      onClick={() => onToggle(spot.id, spot.is_occupied)}
      className={`p-4 rounded-lg transition-all duration-300 border-2 flex flex-col items-center justify-center min-w-[100px] ${
        spot.is_occupied
          ? 'bg-red-500 border-red-600 text-white'
          : 'bg-green-500 border-green-600 text-white hover:bg-green-600'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {spot.is_occupied ? (
          <Car className="w-5 h-5" />
        ) : (
          <CheckCircle className="w-5 h-5" />
        )}
      </div>
      <span className="font-bold text-lg">{spot.spot_number}</span>
      <span className="text-xs mt-1">
        {spot.is_occupied ? 'Ocupada' : 'Livre'}
      </span>
    </button>
  );
}

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWDboYZuynlh11Hi2UDbYy3-sGRbdirdI",
  authDomain: "estacionamentooba-e4a70.firebaseapp.com",
  projectId: "estacionamentooba-e4a70",
  storageBucket: "estacionamentooba-e4a70.firebasestorage.app",
  messagingSenderId: "790943886746",
  appId: "1:790943886746:web:c4967c33c74cbdca92de23"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface ParkingSpot {
  id: string;
  spot_number: string;
  is_occupied: boolean;
  occupied_at: string | null;
  occupied_by?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
}

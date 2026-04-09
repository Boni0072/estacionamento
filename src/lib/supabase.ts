import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCL1fXng9IpMunUFm03VIqAJcdxHcjBv9E",
  authDomain: "oab-projeto.firebaseapp.com",
  databaseURL: "https://oab-projeto-default-rtdb.firebaseio.com",
  projectId: "oab-projeto",
  storageBucket: "oab-projeto.firebasestorage.app",
  messagingSenderId: "274702967007",
  appId: "1:274702967007:web:7dd45811daacb8a4afc96a"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export interface ParkingSpot {
  id: string;
  spot_number: string;
  is_occupied: boolean;
  occupied_at: string | null;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
}

import { useEffect, useState } from 'react';
import { db, ParkingSpot } from '../lib/supabase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { InteractiveParkingMap } from './InteractiveParkingMap';
import { Plus, MapPin, Lock, Unlock, CheckCircle2, Radar, X, Crosshair, Download, Upload, Save, ChevronDown, ChevronUp, Maximize, AlertTriangle } from 'lucide-react';

interface SpotPosition {
  spotNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  latitude?: number;
  longitude?: number;
}

// Tipagem para o evento de instalação do PWA
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = 'parking_spot_positions';
const STORAGE_KEY_ROTATION = 'parking_rotation';
const SPOT_WIDTH = 60.0;
const SPOT_HEIGHT = 18.0;

const DEFAULT_SPOT_POSITIONS: SpotPosition[] = [
  { spotNumber: 'A1', x: 180, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850745, longitude: -47.178021 },
  { spotNumber: 'A2', x: 210, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850751, longitude: -47.178042 },
  { spotNumber: 'A3', x: 240, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850762, longitude: -47.178066 },
  { spotNumber: 'A4', x: 270, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850766, longitude: -47.178089 },
  { spotNumber: 'A5', x: 300, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850771, longitude: -47.178113 },
  { spotNumber: 'A6', x: 330, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850778, longitude: -47.178135 },
  { spotNumber: 'A7', x: 360, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850785, longitude: -47.178158 },
  { spotNumber: 'A8', x: 390, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850789, longitude: -47.178179 },
  { spotNumber: 'A9', x: 420, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850799, longitude: -47.178203 },
  { spotNumber: 'A10', x: 450, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850806, longitude: -47.178221 },
  { spotNumber: 'A11', x: 480, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850812, longitude: -47.178244 },
  { spotNumber: 'A12', x: 510, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850817, longitude: -47.178270 },
  { spotNumber: 'A13', x: 570, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850824, longitude: -47.178292 },
  { spotNumber: 'A14', x: 600, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850833, longitude: -47.178312 },
  { spotNumber: 'A15', x: 630, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850828, longitude: -47.178336 },
  { spotNumber: 'A16', x: 660, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850835, longitude: -47.178358 },
  { spotNumber: 'A17', x: 690, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850842, longitude: -47.178383 },
  { spotNumber: 'A18', x: 720, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850848, longitude: -47.178406 },
  { spotNumber: 'A19', x: 750, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850852, longitude: -47.178427 },
  { spotNumber: 'A20', x: 780, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850865, longitude: -47.178447 },
  { spotNumber: 'A21', x: 810, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850868, longitude: -47.178472 },
  { spotNumber: 'A22', x: 840, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.850875, longitude: -47.178498 },
  { spotNumber: 'A23', x: 870, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'A24', x: 900, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'A25', x: 930, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'A26', x: 960, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'A27', x: 990, y: 95, width: SPOT_WIDTH, height: SPOT_HEIGHT },

  { spotNumber: 'B1', x: 160, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B2', x: 190, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B3', x: 220, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B4', x: 250, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B5', x: 280, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B6', x: 310, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B7', x: 340, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B8', x: 370, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B9', x: 400, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B10', x: 430, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B11', x: 460, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B12', x: 490, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B13', x: 520, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B14', x: 550, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B15', x: 580, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B16', x: 610, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B17', x: 640, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B18', x: 670, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B19', x: 700, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B20', x: 730, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B21', x: 760, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B22', x: 790, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B23', x: 820, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B24', x: 850, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B25', x: 880, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B26', x: 910, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B27', x: 940, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B28', x: 970, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B29', x: 1000, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B30', x: 1030, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B31', x: 1060, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B32', x: 1090, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B33', x: 1120, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B34', x: 1150, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B35', x: 1180, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B36', x: 1210, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'B37', x: 1240, y: 160, width: SPOT_WIDTH, height: SPOT_HEIGHT },

  { spotNumber: 'C1', x: 160, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT, latitude: -22.949165, longitude: -47.281774 },
  { spotNumber: 'C2', x: 190, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C3', x: 220, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C4', x: 250, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C5', x: 280, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C6', x: 310, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C7', x: 340, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C8', x: 370, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C9', x: 400, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C10', x: 430, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C11', x: 460, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C12', x: 490, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C13', x: 520, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C14', x: 550, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C15', x: 580, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C16', x: 610, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C17', x: 640, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C18', x: 670, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C19', x: 700, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C20', x: 730, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C21', x: 760, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C22', x: 790, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C23', x: 820, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C24', x: 850, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C25', x: 880, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C26', x: 910, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C27', x: 940, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C28', x: 970, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C29', x: 1000, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C30', x: 1030, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C31', x: 1060, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C32', x: 1090, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C33', x: 1120, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C34', x: 1150, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C35', x: 1180, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C36', x: 1210, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'C37', x: 1240, y: 280, width: SPOT_WIDTH, height: SPOT_HEIGHT },

  { spotNumber: 'D1', x: 550, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D2', x: 580, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D3', x: 610, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D4', x: 640, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D5', x: 670, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D6', x: 700, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D7', x: 730, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D8', x: 760, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D9', x: 790, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D10', x: 820, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D11', x: 850, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D12', x: 880, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D13', x: 910, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D14', x: 940, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D15', x: 970, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D16', x: 1000, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D17', x: 1030, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D18', x: 1060, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D19', x: 1090, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D20', x: 1120, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D21', x: 1150, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D22', x: 1180, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D23', x: 1210, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D24', x: 1240, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D25', x: 1270, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D26', x: 1300, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D27', x: 1330, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D28', x: 1360, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D29', x: 1390, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D30', x: 1420, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D31', x: 1450, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D32', x: 1480, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D33', x: 1510, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D34', x: 1540, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'D35', x: 1570, y: 330, width: SPOT_WIDTH, height: SPOT_HEIGHT },

  { spotNumber: 'E1', x: 160, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E2', x: 190, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E3', x: 220, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E4', x: 250, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E5', x: 280, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E6', x: 310, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E7', x: 340, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E8', x: 370, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E9', x: 400, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E10', x: 430, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E11', x: 460, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E12', x: 490, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E13', x: 520, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E14', x: 550, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E15', x: 580, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E16', x: 610, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E17', x: 640, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E18', x: 670, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E19', x: 700, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E20', x: 730, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E21', x: 760, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E22', x: 790, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E23', x: 820, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E24', x: 850, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E25', x: 880, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E26', x: 910, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E27', x: 940, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E28', x: 970, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E29', x: 1000, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'E30', x: 1030, y: 380, width: SPOT_WIDTH, height: SPOT_HEIGHT },

  { spotNumber: 'F1', x: 160, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F2', x: 190, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F3', x: 220, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F4', x: 250, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F5', x: 280, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F6', x: 310, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F7', x: 340, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F8', x: 370, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F9', x: 400, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F10', x: 430, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F11', x: 460, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F12', x: 490, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F13', x: 520, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F14', x: 550, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F15', x: 580, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F16', x: 610, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F17', x: 640, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F18', x: 670, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F19', x: 700, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F20', x: 730, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F21', x: 760, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F22', x: 790, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F23', x: 820, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F24', x: 850, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F25', x: 880, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F26', x: 910, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F27', x: 940, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'F28', x: 970, y: 430, width: SPOT_WIDTH, height: SPOT_HEIGHT },

  { spotNumber: 'G1', x: 160, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G2', x: 190, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G3', x: 220, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G4', x: 250, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G5', x: 280, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G6', x: 310, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G7', x: 340, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G8', x: 370, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G9', x: 400, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G10', x: 430, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G11', x: 460, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G12', x: 490, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G13', x: 520, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G14', x: 550, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G15', x: 580, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G16', x: 610, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G17', x: 640, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G18', x: 670, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G19', x: 700, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G20', x: 730, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G21', x: 760, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G22', x: 790, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G23', x: 820, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G24', x: 850, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G25', x: 880, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G26', x: 910, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G27', x: 940, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'G28', x: 970, y: 480, width: SPOT_WIDTH, height: SPOT_HEIGHT },

  { spotNumber: 'H1', x: 160, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H2', x: 190, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H3', x: 220, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H4', x: 250, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H5', x: 280, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H6', x: 310, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H7', x: 340, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H8', x: 370, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H9', x: 400, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H10', x: 430, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H11', x: 460, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H12', x: 490, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H13', x: 520, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H14', x: 550, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H15', x: 580, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H16', x: 610, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H17', x: 640, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H18', x: 670, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
  { spotNumber: 'H19', x: 700, y: 530, width: SPOT_WIDTH, height: SPOT_HEIGHT },
];

export function ParkingManager() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [confirmedSpot, setConfirmedSpot] = useState<string | null>(null);
  const [detectedSpotName, setDetectedSpotName] = useState<string | null>(null);
  const [selectedSpotForEdit, setSelectedSpotForEdit] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [parkingName, setParkingName] = useState('Sistema de Gerenciamento de Estacionamento');
  const [spotPositions, setSpotPositions] = useState<SpotPosition[]>(DEFAULT_SPOT_POSITIONS);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [newSpotNumber, setNewSpotNumber] = useState('');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [globalWidth, setGlobalWidth] = useState(45.0);
  const [globalHeight, setGlobalHeight] = useState(18.0);
  const [rotation, setRotation] = useState(0);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    // Verifica se o app já está instalado/rodando em modo standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detecta se o dispositivo é iOS (iPhone/iPad)
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    console.log('PWA Debug - Standalone:', isStandaloneMode, 'isIOS:', ios);

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('PWA Debug - Evento beforeinstallprompt disparado! O site agora é oficialmente instalável.');
      // Impede o prompt nativo automático para controlarmos quando exibir
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostra o banner personalizado automaticamente ao detectar que é instalável
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert("Para instalar no iPhone/iPad: Toque no ícone de 'Compartilhar' no Safari e selecione 'Adicionar à Tela de Início'.");
      return;
    }
    
    if (!deferredPrompt) {
      alert("Aguardando permissão do navegador para instalar. Certifique-se de que o site está em modo seguro (HTTPS ou localhost).");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Identificador único do usuário (persistido no navegador)
  const [userId] = useState(() => {
    let id = localStorage.getItem('parking_user_device_id');
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('parking_user_device_id', id);
    }
    return id;
  });

  // Efeito principal de Sincronização Firebase
  useEffect(() => {
    const parkingDoc = doc(db, 'config', 'parking');
    
    const unsubscribe = onSnapshot(
      parkingDoc, 
      (snapshot) => {
        console.log("Firestore Update - Existe documento?", snapshot.exists());
        const data = snapshot.data();
        if (data) {
          if (data.spots) setSpots(Object.values(data.spots));
          if (data.spotPositions) setSpotPositions(data.spotPositions);
          if (data.spotWidth) setGlobalWidth(data.spotWidth);
          if (data.spotHeight) setGlobalHeight(data.spotHeight);
          if (data.rotation !== undefined) setRotation(data.rotation);
          if (data.name) setParkingName(data.name);
        } else {
          console.log("Documento não encontrado no Firestore. É necessário inicializar.");
          setFirestoreError("Banco de dados vazio. Clique em 'Inicializar Vagas' no menu de Admin.");
          setSpots([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erro crítico no Firestore:", error);
        setFirestoreError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Efeito para auto-desocupar vagas após 8 horas
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      spots.forEach(spot => {
        if (spot.is_occupied && spot.expires_at) {
          const expirationTime = new Date(spot.expires_at).getTime();
          if (now > expirationTime) {
            // Vaga expirou, libera automaticamente
            const docRef = doc(db, 'config', 'parking');
            updateDoc(docRef, {
              [`spots.${spot.id}.is_occupied`]: false,
              [`spots.${spot.id}.occupied_by`]: null,
              [`spots.${spot.id}.expires_at`]: null,
              [`spots.${spot.id}.updated_at`]: new Date().toISOString(),
            });
          }
        }
      });
    }, 60000); // Verifica a cada minuto
    return () => clearInterval(interval);
  }, [spots]);

  useEffect(() => {
    // Monitoramento contínuo do GPS - pausa se houver uma vaga confirmada
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (confirmedSpot) return; // Trava a atualização se já confirmou
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setGpsError(false);
        },
        (error) => {
          console.error("Erro GPS:", error);
          setGpsError(true);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [confirmedSpot]);

  // Efeito reativo para encontrar e ocupar automaticamente a vaga livre mais próxima via GPS
  useEffect(() => {
    const hasActiveReservation = spots.some(s => s.occupied_by === userId && s.is_occupied);
    if (!userLocation || loading || isEditMode || spots.length === 0 || confirmedSpot || hasActiveReservation) return;

    // Filtra as vagas que possuem GPS cadastrado e associa ao status atual do banco
    const candidates = spotPositions
      .filter(pos => pos.latitude && pos.longitude)
      .map(pos => ({
        pos,
        dbSpot: spots.find(s => s.spot_number === pos.spotNumber)
      }))
      .filter(item => item.dbSpot && !item.dbSpot.is_occupied);

    if (candidates.length === 0) {
      setDetectedSpotName(null);
      return;
    }

    // Algoritmo de busca do vizinho mais próximo (distância Euclidiana quadrada)
    let closestItem = candidates[0];
    let minDistanceSq = Infinity;

    candidates.forEach(item => {
      const dLat = item.pos.latitude! - userLocation.lat;
      const dLng = item.pos.longitude! - userLocation.lng;
      const distSq = dLat * dLat + dLng * dLng;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestItem = item;
      }
    });

    // Threshold de proximidade ajustado para ~7 metros
    if (minDistanceSq < 0.000000004) {
      setDetectedSpotName(closestItem.pos.spotNumber);
    } else {
      setDetectedSpotName(null);
    }
  }, [userLocation, spots, spotPositions, loading, isEditMode, confirmedSpot]);

  const exportData = () => {
    const data = { parkingName, spotPositions, spots, rotation, spotWidth: globalWidth, spotHeight: globalHeight };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estacionamento_${parkingName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const updates: any = {};
        if (data.parkingName) updates['name'] = data.parkingName;
        if (data.spotPositions) updates['spotPositions'] = data.spotPositions;
        if (data.rotation !== undefined) updates['rotation'] = data.rotation;
        if (data.spotWidth) updates['spotWidth'] = data.spotWidth;
        if (data.spotHeight) updates['spotHeight'] = data.spotHeight;
        
        if (data.spots && Array.isArray(data.spots)) {
          const spotsObj: Record<string, any> = {};
          data.spots.forEach((s: any) => {
            spotsObj[s.id || s.spot_number] = s;
          });
          updates['spots'] = spotsObj;
        }

        await updateDoc(doc(db, 'config', 'parking'), updates);
        alert('Dados importados e sincronizados com sucesso para todos os usuários!');
      } catch (err) {
        alert('Erro ao importar arquivo. Verifique o formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  function toggleSpot(spotId: string, currentStatus: boolean) {
    const spot = spots.find(s => s.id === spotId);
    const docRef = doc(db, 'config', 'parking');
    const now = new Date();

    if (!currentStatus) {
      // Impede reserva múltipla: verifica se o usuário já tem uma vaga ocupada
      const activeSpot = spots.find(s => s.occupied_by === userId && s.is_occupied);
      if (activeSpot && !isAdmin) {
        alert(`Você já reservou a vaga ${activeSpot.spot_number}. É necessário liberá-la antes de ocupar outra.`);
        return;
      }

      // Ocupando a vaga: define expiração para 8 horas
      const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      updateDoc(docRef, {
        [`spots.${spotId}.is_occupied`]: true,
        [`spots.${spotId}.occupied_by`]: userId,
        [`spots.${spotId}.occupied_at`]: now.toISOString(),
        [`spots.${spotId}.expires_at`]: expiresAt.toISOString(),
        [`spots.${spotId}.updated_at`]: now.toISOString(),
      });
    } else {
      // Desocupando: verifica se é o dono ou admin
      if (isAdmin || spot?.occupied_by === userId) {
        updateDoc(docRef, {
          [`spots.${spotId}.is_occupied`]: false,
          [`spots.${spotId}.occupied_by`]: null,
          [`spots.${spotId}.expires_at`]: null,
          [`spots.${spotId}.updated_at`]: now.toISOString(),
        });
      } else {
        alert("Atenção: Apenas o usuário que ocupou esta vaga ou um administrador pode liberá-la.");
      }
    }
  }

  async function resetDatabase() {
    if (!confirm("ATENÇÃO: Isso apagará todas as posições atuais e forçará as novas dimensões (18x12). Deseja continuar?")) return;
    
    setLoading(true);
    const initialSpots: Record<string, any> = {};
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (const section of sections) {
      const limit = section === 'H' ? 19 : 20;
      for (let i = 1; i <= limit; i++) {
        const num = `${section}${i}`;
        initialSpots[num] = {
          id: num,
          spot_number: num,
          is_occupied: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }

    try {
      await setDoc(doc(db, 'config', 'parking'), {
        spots: initialSpots,
        spotPositions: DEFAULT_SPOT_POSITIONS,
        spotWidth: 45.0,
        spotHeight: 18.0,
        rotation: 0,
        name: 'Sistema de Gerenciamento de Estacionamento'
      });
      alert('Banco de dados resetado com sucesso!');
    } catch (err) {
      alert('Erro ao resetar banco.');
    }
    setLoading(false);
  }

  async function initializeSpots() {
    const initialSpots: Record<string, any> = {};

    // Criar seções de A até G com 20 vagas, e H até 19 conforme solicitado
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (const section of sections) {
      const limit = section === 'H' ? 19 : 20;
      for (let i = 1; i <= limit; i++) {
        const num = `${section}${i}`;
        initialSpots[num] = {
          id: num,
          spot_number: num,
          is_occupied: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }
    try {
      console.log("Tentando inicializar banco de dados...");
      await setDoc(doc(db, 'config', 'parking'), {
        spots: initialSpots,
        spotPositions: DEFAULT_SPOT_POSITIONS,
        spotWidth: 45.0,
        spotHeight: 18.0,
        rotation: 0,
        name: 'Sistema de Gerenciamento de Estacionamento'
      });
      alert('Banco de dados inicializado com sucesso!');
    } catch (err) {
      console.error("Erro ao inicializar:", err);
      alert('Erro de permissão no Firebase. Verifique as Rules.');
    }
  }

  function updateSpotPosition(spotNumber: string, x: number, y: number) {
    const newPositions = spotPositions.map(pos =>
        pos.spotNumber === spotNumber ? { ...pos, x, y } : pos
    );
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
  }

  function updateSpotRotation(spotNumber: string, rotation: number) {
    const newPositions = spotPositions.map(pos =>
        pos.spotNumber === spotNumber ? { ...pos, rotation } : pos
    );
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
  }

  function deleteSpot(spotNumber: string) {
    const newPositions = spotPositions.filter(pos => pos.spotNumber !== spotNumber);
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
  }

  function updateSpotWidth(spotNumber: string, width: number) {
    const newPositions = spotPositions.map(pos =>
        pos.spotNumber === spotNumber ? { ...pos, width } : pos
    );
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
  }

  function updateSpotHeight(spotNumber: string, height: number) {
    const newPositions = spotPositions.map(pos =>
        pos.spotNumber === spotNumber ? { ...pos, height } : pos
    );
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
  }

  function updateSpotLatitude(spotNumber: string, latitude: number) {
    const newPositions = spotPositions.map(pos =>
        pos.spotNumber === spotNumber ? { ...pos, latitude } : pos
    );
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
  }

  function updateSpotLongitude(spotNumber: string, longitude: number) {
    const newPositions = spotPositions.map(pos =>
        pos.spotNumber === spotNumber ? { ...pos, longitude } : pos
    );
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
  }

  function updateGlobalConfig(field: string, value: number) {
    updateDoc(doc(db, 'config', 'parking'), { [field]: value });
  }

  function applyDimensionsToAll() {
    if (!confirm("Isso irá resetar o tamanho de TODAS as vagas para os valores atuais. Deseja continuar?")) return;
    
    const newPositions = spotPositions.map(pos => ({
      ...pos,
      width: globalWidth,
      height: globalHeight
    }));
    
    updateDoc(doc(db, 'config', 'parking'), { 
      spotPositions: newPositions 
    });
  }

  function handleAddSpot() {
    const newPosition = newSpotNumber.trim().toUpperCase();
    if (!newPosition) return;
    if (spotPositions.some(spot => spot.spotNumber === newPosition)) return;

    const newPositions = [
      ...spotPositions,
      {
        spotNumber: newPosition,
        x: 100,
        y: 100,
        width: globalWidth,
        height: globalHeight
      }
    ];
    updateDoc(doc(db, 'config', 'parking'), { spotPositions: newPositions });
    setNewSpotNumber('');
  }

  const markerNumbers = new Set(spotPositions.map(p => p.spotNumber));
  const totalMarkers = spotPositions.length;
  const occupiedCount = spots.filter(s => 
    s.is_occupied && markerNumbers.has(s.spot_number)
  ).length;
  const availableCount = totalMarkers - occupiedCount;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {firestoreError && (
        <div className="bg-red-600 text-white p-2 text-center text-xs font-bold flex items-center justify-center gap-2 z-[100]">
          <AlertTriangle className="w-4 h-4" />
          Erro de Conexão: {firestoreError === 'permission-denied' 
            ? 'Acesso negado. Verifique as "Rules" no Console do Firebase.' 
            : firestoreError}
        </div>
      )}

      <div className="w-full h-full p-2 sm:p-4 flex flex-col landscape:flex-row gap-2 sm:gap-4 overflow-hidden">
        {(isEditMode || (spots.length === 0 && !loading) || firestoreError) && (
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 shrink-0 landscape:w-80 landscape:h-full landscape:overflow-y-auto transition-all custom-scrollbar z-50">
            
            {firestoreError && !isEditMode && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                <p className="font-bold flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4" /> Status do Sistema
                </p>
                {firestoreError}
                <p className="mt-2 font-semibold">Acesse o cadeado (Admin) para configurar.</p>
              </div>
            )}

            {isEditMode && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Maximize className="w-3 h-3" /> Configurações de Exibição
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">LARGURA VAGAS</label>
                    <input 
                      type="number" 
                      value={globalWidth} 
                      onChange={(e) => updateGlobalConfig('spotWidth', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">ALTURA VAGAS</label>
                    <input 
                      type="number" 
                      value={globalHeight} 
                      onChange={(e) => updateGlobalConfig('spotHeight', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-600">GIRO DO MAPA (GRAUS)</label>
                  <input 
                    type="number" 
                    value={rotation} 
                    onChange={(e) => updateGlobalConfig('rotation', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-400 outline-none"
                  />
                </div>

                <button
                  onClick={applyDimensionsToAll}
                  className="w-full py-1.5 bg-gray-800 text-white text-[10px] font-bold rounded hover:bg-black transition-colors uppercase tracking-tight"
                >
                  Redimensionar Vagas Atuais
                </button>
              </div>

              <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4">
                <p className="text-xs text-blue-700 mb-2 font-medium">
                  Clique em uma vaga para editar coordenadas ou arraste-a para mudar a posição.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="text"
                    placeholder="Nova vaga (ex: E1)"
                    value={newSpotNumber}
                    onChange={e => setNewSpotNumber(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddSpot}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Adicionar vaga
                  </button>
                </div>
              </div>

              {selectedSpotForEdit && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-yellow-800">Editando Vaga: {selectedSpotForEdit}</h3>
                    <button onClick={() => setSelectedSpotForEdit(null)} className="text-yellow-600 hover:text-yellow-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-yellow-700 mb-1 uppercase">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={spotPositions.find(p => p.spotNumber === selectedSpotForEdit)?.latitude || ''}
                        onChange={(e) => updateSpotLatitude(selectedSpotForEdit, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-yellow-700 mb-1 uppercase">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={spotPositions.find(p => p.spotNumber === selectedSpotForEdit)?.longitude || ''}
                        onChange={(e) => updateSpotLongitude(selectedSpotForEdit, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-yellow-700 mb-1 uppercase">Largura</label>
                      <input
                        type="number"
                        value={spotPositions.find(p => p.spotNumber === selectedSpotForEdit)?.width || ''}
                        onChange={(e) => updateSpotWidth(selectedSpotForEdit, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-yellow-700 mb-1 uppercase">Altura</label>
                      <input
                        type="number"
                        value={spotPositions.find(p => p.spotNumber === selectedSpotForEdit)?.height || ''}
                        onChange={(e) => updateSpotHeight(selectedSpotForEdit, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-yellow-700 mb-1 uppercase">Giro Individual (Graus)</label>
                      <input
                        type="number"
                        value={spotPositions.find(p => p.spotNumber === selectedSpotForEdit)?.rotation || 0}
                        onChange={(e) => updateSpotRotation(selectedSpotForEdit, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                      />
                    </div>
                  </div>
                  {userLocation && (
                    <button
                      onClick={() => {
                        updateSpotLatitude(selectedSpotForEdit, userLocation.lat);
                        updateSpotLongitude(selectedSpotForEdit, userLocation.lng);
                      }}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-yellow-600 text-white font-bold py-2 rounded-lg hover:bg-yellow-700 transition-all shadow-md"
                    >
                      <Crosshair className="w-4 h-4" />
                      Usar Minha Localização Atual GPS
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {spots.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Nenhuma vaga cadastrada</p>
              <button
                onClick={initializeSpots}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Inicializar Vagas
              </button>
            </div>
            )}
          </div>
        )}

        {spots.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4 flex-grow relative flex flex-col min-h-0 overflow-hidden">
            <h2 className="text-xs sm:text-lg font-bold text-gray-400 mb-2 shrink-0 px-2">Clique nas vagas para reservar</h2>
            
            {/* Overlay Consolidado no Canto Superior Direito */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-3 items-end pointer-events-none max-h-[90%] overflow-y-auto custom-scrollbar p-2">
              
              {/* Card de Localização GPS */}
              <div className={`p-3 rounded-xl border backdrop-blur-md shadow-lg pointer-events-auto transition-all min-w-[180px] ${confirmedSpot ? 'bg-green-50/40 border-green-200/50' : 'bg-indigo-50/40 border-indigo-200/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={`w-3 h-3 ${confirmedSpot ? 'text-green-600' : 'text-indigo-600'}`} />
                  <p className={`text-[10px] font-bold uppercase tracking-tight ${confirmedSpot ? 'text-green-600' : 'text-indigo-600'}`}>Localização</p>
                </div>
                {userLocation ? (
                  <div className="space-y-1">
                    {confirmedSpot ? (
                      <div className="bg-white/40 backdrop-blur-sm p-1.5 rounded-md">
                        <p className="text-[10px] font-bold text-green-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Vaga: {confirmedSpot}
                        </p>
                        <button 
                          onClick={() => {
                            const spot = spots.find(s => s.spot_number === confirmedSpot);
                            if (spot) toggleSpot(spot.id, true);
                            setConfirmedSpot(null);
                          }}
                          className="mt-1 w-full text-[9px] font-bold bg-green-600/60 text-white px-2 py-1 rounded hover:bg-green-700/80 transition-colors flex items-center justify-center gap-1"
                        >
                          <Unlock className="w-2.5 h-2.5" /> Liberar
                        </button>
                      </div>
                    ) : detectedSpotName ? (
                      <div className="bg-white/40 backdrop-blur-sm border border-indigo-200/30 p-1.5 rounded-md shadow-sm">
                        <p className="text-[10px] font-bold text-indigo-900">Sugerida: {detectedSpotName}</p>
                        <button 
                          onClick={() => {
                            const targetSpot = spots.find(s => s.spot_number === detectedSpotName);
                            if (targetSpot) {
                              toggleSpot(targetSpot.id, false);
                              setConfirmedSpot(detectedSpotName);
                              setDetectedSpotName(null);
                            }
                          }}
                          className="mt-1 w-full text-[9px] font-bold bg-indigo-600/60 text-white px-2 py-1 rounded hover:bg-indigo-700/80 transition-colors"
                        >
                          Confirmar Ocupação
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-0.5">
                        <Radar className="w-3 h-3 text-indigo-600 animate-pulse" />
                        <p className="text-[10px] text-indigo-600 font-bold italic">Buscando...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-indigo-600 italic">Sinal GPS...</p>
                )}
              </div>

              {/* Grupo de Botões de Ação */}
              <div className="flex flex-wrap gap-2 justify-end pointer-events-auto">
                {!isAdmin ? (
                  <button
                    onClick={() => {
                      const pass = prompt('Digite a senha para acessar as configurações:');
                      if (pass === 'ObaFacilitis2026') setIsAdmin(true);
                      else if (pass !== null) alert('Senha incorreta!');
                    }}
                    className="p-2.5 rounded-lg bg-gray-600/40 backdrop-blur-md text-gray-700 hover:bg-gray-600/60 transition-all border border-white/30 shadow-sm"
                    title="Administração"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditMode(prev => !prev)}
                      className={`p-2.5 rounded-lg border backdrop-blur-md transition-all shadow-sm ${
                        isEditMode ? 'bg-yellow-500/40 border-yellow-200/50 text-yellow-700' : 'bg-blue-500/40 border-blue-200/50 text-blue-700'
                      }`}
                      title={isEditMode ? 'Sair do modo edição' : 'Modo edição'}
                    >
                      {isEditMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        const newRot = rotation - 90;
                        updateDoc(doc(db, 'config', 'parking'), { rotation: newRot });
                      }}
                      className="p-2.5 rounded-lg bg-indigo-500/40 backdrop-blur-md text-indigo-700 border border-indigo-200/50 shadow-sm hover:bg-indigo-500/60"
                      title="Girar vagas"
                    >
                      <Radar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={exportData}
                      className="p-2.5 rounded-lg bg-green-600/40 backdrop-blur-md text-green-700 border border-green-200/50 shadow-sm hover:bg-green-600/60"
                      title="Exportar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <label className="p-2.5 rounded-lg bg-orange-600/40 backdrop-blur-md text-orange-700 border border-orange-200/50 shadow-sm hover:bg-orange-600/60 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept=".json" onChange={importData} className="hidden" />
                    </label>
                    <button
                      onClick={resetDatabase}
                      className="p-2.5 rounded-lg bg-black text-white border border-red-500 shadow-sm hover:bg-red-900 transition-all"
                      title="RESETAR TUDO (Cuidado!)"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setIsAdmin(false); setIsEditMode(false); }}
                      className="p-2.5 rounded-lg bg-red-500/40 backdrop-blur-md text-red-700 border border-red-200/50 shadow-sm hover:bg-red-500/60"
                      title="Sair do Admin"
                    >
                      <Unlock className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-2.5 rounded-lg bg-white/40 backdrop-blur-md text-gray-600 border border-gray-200/50 shadow-sm hover:bg-white/60 transition-all"
                  title={showStats ? "Ocultar estatísticas" : "Ver estatísticas"}
                >
                  {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {!isStandalone && (
                  <button
                    onClick={handleInstallClick}
                    className="p-2.5 rounded-lg bg-indigo-600/40 backdrop-blur-md text-indigo-700 border border-indigo-200/50 shadow-sm hover:bg-indigo-600/60"
                    title="Instalar App"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Estatísticas */}
              {showStats && (
                <div className="flex flex-col gap-2 pointer-events-none">
                  <div className="bg-blue-50/40 backdrop-blur-md p-2.5 rounded-lg border border-blue-200/50 shadow-sm text-center min-w-[100px]">
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Total</p>
                    <p className="text-xl font-black text-blue-700 leading-none">{totalMarkers}</p>
                  </div>
                  <div className="bg-green-50/40 backdrop-blur-md p-2.5 rounded-lg border border-green-200/50 shadow-sm text-center min-w-[100px]">
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Livres</p>
                    <p className="text-xl font-black text-green-700 leading-none">{availableCount}</p>
                  </div>
                  <div className="bg-red-50/40 backdrop-blur-md p-2.5 rounded-lg border border-red-200/50 shadow-sm text-center min-w-[100px]">
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Ocupadas</p>
                    <p className="text-xl font-black text-red-700 leading-none">{occupiedCount}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-grow min-h-0">
              <InteractiveParkingMap
                spots={spots}
                spotPositions={spotPositions}
                onSpotClick={toggleSpot}
                isEditing={isEditMode}
                onUpdatePosition={updateSpotPosition}
                rotation={rotation}
                onUpdateRotation={updateSpotRotation}
                onDeleteSpot={deleteSpot}
                selectedSpot={selectedSpotForEdit}
                onSelectSpot={setSelectedSpotForEdit}
                globalWidth={globalWidth}
                globalHeight={globalHeight}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

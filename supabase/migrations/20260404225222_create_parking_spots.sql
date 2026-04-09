/*
  # Parking Management System

  1. New Tables
    - `parking_spots`
      - `id` (uuid, primary key) - Unique identifier for each parking spot
      - `spot_number` (text, unique, not null) - Spot number/identifier (e.g., "A1", "B2")
      - `is_occupied` (boolean, default false) - Whether the spot is currently occupied
      - `occupied_at` (timestamptz, nullable) - When the spot was occupied
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on `parking_spots` table
    - Add policy for anyone to read parking spots
    - Add policy for anyone to update parking spot status
*/

CREATE TABLE IF NOT EXISTS parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_number text UNIQUE NOT NULL,
  is_occupied boolean DEFAULT false,
  occupied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view parking spots"
  ON parking_spots
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update parking spot status"
  ON parking_spots
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert parking spots"
  ON parking_spots
  FOR INSERT
  TO anon
  WITH CHECK (true);
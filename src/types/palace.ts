export interface Location {
  id: string;
  name: string;
  description: string;
  image: string;
  order?: number;
}

export interface CustomPalaceData {
  name: string;
  description: string;
  thumbnail: string;
  locations: Location[];
}

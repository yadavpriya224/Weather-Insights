import { useState, useEffect } from "react";
import { Location } from "../services/api";

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        // Fallback to a default location (e.g., London) if GPS fails
        setLocation({ lat: 51.5074, lon: -0.1278 });
        setLoading(false);
      }
    );
  }, []);

  return { location, error, loading };
}

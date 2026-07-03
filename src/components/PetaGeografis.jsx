import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const KOORDINAT_KOTA = {
  Pekanbaru: [0.5071, 101.4478],
  Medan: [3.5952, 98.6722],
  Palembang: [-2.9761, 104.7754],
  Jambi: [-1.6101, 103.6131],
  Padang: [-0.9471, 100.4172],
  Dumai: [1.6667, 101.45],
  Bengkalis: [1.4661, 102.0935],
  "Rokan Hilir": [2.1667, 100.8167],
};

function PetaGeografis({ ranking, daftarKota }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined;
    }

    const map = L.map(containerRef.current, {
      center: [0.6, 101.5],
      zoom: 6,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const kapasitasMap = new Map(daftarKota.map((kota) => [kota.nama, kota.kapasitas]));
    const maxPermintaan = Math.max(1, ...ranking.map((item) => item.totalPermintaan));

    ranking.forEach((item) => {
      const koordinat = KOORDINAT_KOTA[item.kota];
      if (!koordinat) {
        return;
      }

      const radius = 8 + (item.totalPermintaan / maxPermintaan) * 16;
      const marker = L.circleMarker(koordinat, {
        radius,
        color: "#006a43",
        weight: 2,
        fillColor: "#006a43",
        fillOpacity: 0.45,
      }).addTo(map);

      marker.bindPopup(
        `<strong>${item.kota}</strong><br/>Permintaan: ${item.totalPermintaan} ton<br/>Kapasitas: ${
          kapasitasMap.get(item.kota) ?? "-"
        } ton`
      );

      markersRef.current.push(marker);
    });
  }, [ranking, daftarKota]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "420px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
      }}
    />
  );
}

export default PetaGeografis;

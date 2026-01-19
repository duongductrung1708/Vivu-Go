"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, DollarSign, MapPin } from "lucide-react";
import { useTripStore } from "@/store/useTripStore";
import { WeatherPreview } from "./WeatherPreview";

export function TripConfig() {
  const { trip, setConfig } = useTripStore();
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [peopleCount, setPeopleCount] = useState<number | "">(trip.peopleCount);
  const [totalBudget, setTotalBudget] = useState<number | "">(trip.totalBudget);

  // Sync local form state when trip data changes (e.g., after loading from DB)
  useEffect(() => {
    setName(trip.name);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setPeopleCount(trip.peopleCount);
    setTotalBudget(trip.totalBudget);
  }, [trip]);

  // Lấy vị trí từ các địa điểm trong chuyến đi nếu có, nếu không trả về null
  const getLocation = () => {
    // Tìm địa điểm đầu tiên có tọa độ
    for (const day of trip.days) {
      for (const place of day.places) {
        if (place.latitude && place.longitude) {
          return {
            lat: place.latitude,
            lng: place.longitude,
          };
        }
      }
    }
    // Trả về null nếu không có địa điểm nào có tọa độ
    return null;
  };

  const location = getLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(startDate) > new Date(endDate)) {
      alert("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    setConfig({
      name,
      startDate,
      endDate,
      peopleCount: peopleCount === "" ? 1 : peopleCount,
      totalBudget: totalBudget === "" ? 0 : totalBudget,
    });
  };

  const daysDiff =
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border-border rounded-3xl border p-3 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="text-primary h-4 w-4" />
        <h2 className="text-card-foreground text-base font-semibold">Cấu hình chuyến đi</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="trip-name"
            className="text-muted-foreground mb-1 block text-xs font-medium"
          >
            Tên chuyến đi
          </label>
          <input
            id="trip-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border bg-muted text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-2xl border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
            placeholder="VD: Chuyến đi Hà Nội"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="start-date"
              className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600"
            >
              <Calendar className="h-3.5 w-3.5" />
              Ngày bắt đầu
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-border bg-muted text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-2xl border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600"
            >
              <Calendar className="h-3.5 w-3.5" />
              Ngày kết thúc
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-border bg-muted text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-2xl border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
              required
            />
          </div>
        </div>

        {daysDiff > 0 && (
          <>
            <div className="rounded-2xl bg-sky-50 px-2.5 py-1.5 text-xs text-sky-700">
              Sẽ tạo {daysDiff} {daysDiff === 1 ? "ngày" : "ngày"}
            </div>
            {/* Xem trước thời tiết - Chỉ hiển thị khi có vị trí */}
            {location && (
              <WeatherPreview
                latitude={location.lat}
                longitude={location.lng}
                startDate={startDate}
                endDate={endDate}
              />
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="people-count"
              className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600"
            >
              <Users className="h-3.5 w-3.5" />
              Số người
            </label>
            <input
              id="people-count"
              type="number"
              min="1"
              value={peopleCount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setPeopleCount("");
                  return;
                }
                const num = parseInt(val, 10);
                setPeopleCount(Number.isNaN(num) ? "" : Math.max(1, num));
              }}
              className="border-border bg-muted text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-2xl border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
              required
            />
          </div>

          <div>
            <label
              htmlFor="budget"
              className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Ngân sách (VND)
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              value={totalBudget}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setTotalBudget("");
                  return;
                }
                const num = parseInt(val, 10);
                setTotalBudget(Number.isNaN(num) ? "" : Math.max(0, num));
              }}
              className="border-border bg-muted text-foreground focus:border-primary focus:ring-primary/20 w-full rounded-2xl border px-3 py-1.5 text-sm focus:ring-2 focus:outline-none"
              placeholder="Tùy chọn"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-primary text-primary-foreground w-full rounded-2xl px-3 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
        >
          Lưu cấu hình
        </motion.button>
      </form>
    </motion.div>
  );
}

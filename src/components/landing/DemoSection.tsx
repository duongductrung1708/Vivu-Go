"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const DemoSection = () => {
  const { t } = useTranslation();
  const [currentDay, setCurrentDay] = useState(0);

  const itinerary = useMemo(
    () => [
      {
        day: 1,
        title: t("landing.demo.day1.title", "Phố Cổ & Hoài Niệm"),
        color: "from-accent/80 to-accent",
        places: [
          {
            name: t("landing.demo.day1.place1", "Phở Bưng"),
            time: "7:00 - 8:00",
            icon: "🍜",
            type: "food",
          },
          {
            name: t("landing.demo.day1.place2", "Nhà tù Hỏa Lò"),
            time: "9:00 - 11:00",
            icon: "🏛️",
            type: "visit",
          },
          {
            name: t("landing.demo.day1.place3", "Nhà Thờ Lớn Hà Nội"),
            time: "14:00 - 15:30",
            icon: "⛪",
            type: "visit",
          },
          {
            name: t("landing.demo.day1.place4", "Phố đi bộ Hồ Gươm"),
            time: "18:00 - 21:00",
            icon: "🚶",
            type: "walk",
          },
        ],
      },
      {
        day: 2,
        title: t("landing.demo.day2.title", "Trái Tim Văn Hiến"),
        color: "from-primary/80 to-primary",
        places: [
          {
            name: t("landing.demo.day2.place1", "Lăng Chủ tịch Hồ Chí Minh"),
            time: "7:30 - 9:30",
            icon: "🏛️",
            type: "visit",
          },
          {
            name: t("landing.demo.day2.place2", "Văn Miếu - Quốc Tử Giám"),
            time: "10:00 - 12:00",
            icon: "📚",
            type: "visit",
          },
          {
            name: t("landing.demo.day2.place3", "Bún chả Hương Liên"),
            time: "12:30 - 13:30",
            icon: "🍜",
            type: "food",
          },
          {
            name: t("landing.demo.day2.place4", "Hồ Tây - Phủ Tây Hồ"),
            time: "15:00 - 18:00",
            icon: "🌊",
            type: "visit",
          },
        ],
      },
      {
        day: 3,
        title: t("landing.demo.day3.title", "Kết nối Hiện Đại"),
        color: "from-[hsl(260,60%,50%)]/80 to-[hsl(260,60%,50%)]",
        places: [
          {
            name: t("landing.demo.day3.place1", "Bảo tàng Lịch sử Quân sự"),
            time: "8:00 - 10:30",
            icon: "🎖️",
            type: "visit",
          },
          {
            name: t("landing.demo.day3.place2", "ĐH FPT Hòa Lạc"),
            time: "12:00 - 14:00",
            icon: "🎓",
            type: "visit",
          },
          {
            name: t("landing.demo.day3.place3", "Làng cổ Đường Lâm"),
            time: "15:00 - 17:00",
            icon: "🏘️",
            type: "visit",
          },
          {
            name: t("landing.demo.day3.place4", "Học viện Quân Y"),
            time: "17:30 - 18:30",
            icon: "🏥",
            type: "visit",
          },
        ],
      },
    ],
    [t],
  );

  const nextDay = () => setCurrentDay((prev) => (prev + 1) % itinerary.length);
  const prevDay = () => setCurrentDay((prev) => (prev - 1 + itinerary.length) % itinerary.length);

  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            {t("landing.demo.title", "Demo")}:{" "}
            <span className="text-gradient">
              {t("landing.demo.subtitle", "3 Ngày Oanh Tạc Hà Nội")}
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            {t("landing.demo.description")}
          </p>
        </motion.div>

        {/* Day selector */}
        <div className="mb-8 flex justify-center gap-4">
          {itinerary.map((day, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentDay(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full px-6 py-3 font-semibold transition-all ${
                currentDay === index
                  ? `bg-linear-to-r ${day.color} text-white shadow-lg`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t("itinerary.day")} {day.day}
            </motion.button>
          ))}
        </div>

        {/* Carousel */}
        <div className="relative mx-auto max-w-4xl">
          <Button
            variant="outline"
            size="icon"
            className="bg-background absolute top-1/2 left-0 z-10 h-12 w-12 -translate-x-4 -translate-y-1/2 rounded-full shadow-lg"
            onClick={prevDay}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="bg-background absolute top-1/2 right-0 z-10 h-12 w-12 translate-x-4 -translate-y-1/2 rounded-full shadow-lg"
            onClick={nextDay}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <motion.div
            key={currentDay}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className={`bg-linear-to-br ${itinerary[currentDay].color} rounded-3xl p-8 text-white shadow-2xl`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white/80">
                  {t("itinerary.day")} {itinerary[currentDay].day}
                </span>
                <h3 className="text-2xl font-bold md:text-3xl">{itinerary[currentDay].title}</h3>
              </div>
              <div className="text-right">
                <span className="text-sm text-white/80">{t("itinerary.total")}</span>
                <p className="text-xl font-semibold">
                  {itinerary[currentDay].places.length} {t("profile.destinations")}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {itinerary[currentDay].places.map((place, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="flex items-center gap-4 rounded-2xl bg-white/20 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/30 text-2xl">
                    {place.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold">{place.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Clock className="h-4 w-4" />
                      <span>{place.time}</span>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 font-bold">
                    {index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Dots indicator */}
        <div className="mt-6 flex justify-center gap-2">
          {itinerary.map((_, index) => (
            <motion.div
              key={index}
              className={`h-3 w-3 rounded-full transition-all ${
                currentDay === index ? "bg-primary w-8" : "bg-muted"
              }`}
              whileHover={{ scale: 1.2 }}
              onClick={() => setCurrentDay(index)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DemoSection;

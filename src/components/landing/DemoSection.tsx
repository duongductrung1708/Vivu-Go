"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const itinerary = [
  {
    day: 1,
    title: "Phố Cổ & Hoài Niệm",
    color: "from-accent/80 to-accent",
    places: [
      { name: "Phở Bưng", time: "7:00 - 8:00", icon: "🍜", type: "food" },
      {
        name: "Nhà tù Hỏa Lò",
        time: "9:00 - 11:00",
        icon: "🏛️",
        type: "visit",
      },
      {
        name: "Nhà Thờ Lớn Hà Nội",
        time: "14:00 - 15:30",
        icon: "⛪",
        type: "visit",
      },
      {
        name: "Phố đi bộ Hồ Gươm",
        time: "18:00 - 21:00",
        icon: "🚶",
        type: "walk",
      },
    ],
  },
  {
    day: 2,
    title: "Trái Tim Văn Hiến",
    color: "from-primary/80 to-primary",
    places: [
      {
        name: "Lăng Chủ tịch Hồ Chí Minh",
        time: "7:30 - 9:30",
        icon: "🏛️",
        type: "visit",
      },
      {
        name: "Văn Miếu - Quốc Tử Giám",
        time: "10:00 - 12:00",
        icon: "📚",
        type: "visit",
      },
      {
        name: "Bún chả Hương Liên",
        time: "12:30 - 13:30",
        icon: "🍜",
        type: "food",
      },
      {
        name: "Hồ Tây - Phủ Tây Hồ",
        time: "15:00 - 18:00",
        icon: "🌊",
        type: "visit",
      },
    ],
  },
  {
    day: 3,
    title: "Kết nối Hiện Đại",
    color: "from-[hsl(260,60%,50%)]/80 to-[hsl(260,60%,50%)]",
    places: [
      {
        name: "Bảo tàng Lịch sử Quân sự",
        time: "8:00 - 10:30",
        icon: "🎖️",
        type: "visit",
      },
      {
        name: "ĐH FPT Hòa Lạc",
        time: "12:00 - 14:00",
        icon: "🎓",
        type: "visit",
      },
      {
        name: "Làng cổ Đường Lâm",
        time: "15:00 - 17:00",
        icon: "🏘️",
        type: "visit",
      },
      {
        name: "Học viện Quân Y",
        time: "17:30 - 18:30",
        icon: "🏥",
        type: "visit",
      },
    ],
  },
];

const DemoSection = () => {
  const [currentDay, setCurrentDay] = useState(0);

  const nextDay = () => setCurrentDay((prev) => (prev + 1) % itinerary.length);
  const prevDay = () =>
    setCurrentDay((prev) => (prev - 1 + itinerary.length) % itinerary.length);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Demo: <span className="text-gradient">3 Ngày Oanh Tạc Hà Nội</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Khám phá lịch trình mẫu hoàn hảo cho chuyến du lịch Hà Nội của bạn
          </p>
        </motion.div>

        {/* Day selector */}
        <div className="flex justify-center gap-4 mb-8">
          {itinerary.map((day, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentDay(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                currentDay === index
                  ? `bg-linear-to-r ${day.color} text-white shadow-lg`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Ngày {day.day}
            </motion.button>
          ))}
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full w-12 h-12 bg-background shadow-lg"
            onClick={prevDay}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full w-12 h-12 bg-background shadow-lg"
            onClick={nextDay}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          <motion.div
            key={currentDay}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className={`bg-linear-to-br ${itinerary[currentDay].color} rounded-3xl p-8 text-white shadow-2xl`}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-white/80 text-sm font-medium">
                  Ngày {itinerary[currentDay].day}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold">
                  {itinerary[currentDay].title}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-white/80 text-sm">Tổng cộng</span>
                <p className="text-xl font-semibold">
                  {itinerary[currentDay].places.length} điểm đến
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
                  className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center text-2xl">
                    {place.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{place.name}</h4>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{place.time}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {itinerary.map((_, index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
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

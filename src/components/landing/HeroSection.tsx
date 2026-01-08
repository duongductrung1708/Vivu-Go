"use client";

import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const HeroSection = () => {
  return (
    <section className="min-h-screen relative overflow-hidden bg-linear-to-br from-background via-secondary/30 to-background">
      <Navbar />
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/40 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 min-h-[80vh]">
          {/* Left Content */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Vivu Go</span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Lên kế hoạch mọi chuyến đi,
              <span className="text-gradient"> chỉ trong vài cú click.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Công cụ thông minh giúp bạn tự thiết lập lịch trình, tối ưu đường
              đi và quản lý chi phí linh hoạt cho mọi nhóm bạn.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition-all"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Bắt đầu lên lịch ngay
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-lg font-semibold border-2"
              >
                Xem demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Content - App Mockup */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              {/* Phone mockup frame */}
              <motion.div
                className="relative bg-card rounded-[3rem] p-3 shadow-2xl border-8 border-foreground/10 max-w-sm mx-auto"
                whileHover={{ y: -10, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-linear-to-br from-primary/20 via-secondary to-accent/20 rounded-[2.5rem] overflow-hidden aspect-9/16">
                  {/* Mock app content */}
                  <div className="p-4 h-full flex flex-col">
                    <div className="bg-background/80 backdrop-blur rounded-2xl p-3 mb-3">
                      <p className="text-sm font-semibold text-foreground">
                        📍 Hà Nội Trip
                      </p>
                      <p className="text-xs text-muted-foreground">
                        3 ngày • 5 điểm đến
                      </p>
                    </div>

                    {/* Map placeholder */}
                    <div className="flex-1 bg-secondary/50 rounded-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-accent/30" />
                      {/* Route lines */}
                      <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                      >
                        <motion.path
                          d="M 20 30 Q 40 20 50 40 T 80 60"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="5,5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </svg>
                      {/* Location markers */}
                      <motion.div
                        className="absolute top-[25%] left-[18%] w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-xs">1</span>
                      </motion.div>
                      <motion.div
                        className="absolute top-[40%] left-[45%] w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 0.3,
                        }}
                      >
                        <span className="text-xs text-primary-foreground">
                          2
                        </span>
                      </motion.div>
                      <motion.div
                        className="absolute top-[55%] right-[18%] w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 0.6,
                        }}
                      >
                        <span className="text-xs">3</span>
                      </motion.div>
                    </div>

                    {/* Bottom cards */}
                    <div className="mt-3 space-y-2">
                      <div className="bg-background/80 backdrop-blur rounded-xl p-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          🏛️
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">Văn Miếu</p>
                          <p className="text-[10px] text-muted-foreground">
                            9:00 - 11:00
                          </p>
                        </div>
                      </div>
                      <div className="bg-background/80 backdrop-blur rounded-xl p-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          🌸
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">Hồ Hoàn Kiếm</p>
                          <p className="text-[10px] text-muted-foreground">
                            14:00 - 16:00
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎯 Tối ưu lộ trình
              </motion.div>
              <motion.div
                className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium"
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              >
                💰 Chia chi phí
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

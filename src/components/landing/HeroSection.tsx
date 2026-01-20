"use client";

import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const HeroSection = () => {
  const { t } = useTranslation();
  return (
    <section className="from-background via-secondary/30 to-background relative min-h-screen overflow-hidden bg-linear-to-br">
      <Navbar />
      {/* Decorative blobs - fixed dimensions to prevent CLS */}
      <div
        className="bg-primary/20 absolute top-20 left-10 h-72 w-72 rounded-full blur-3xl"
        style={{ contain: "layout" }}
      />
      <div
        className="bg-accent/20 absolute right-10 bottom-20 h-96 w-96 rounded-full blur-3xl"
        style={{ contain: "layout" }}
      />
      <div
        className="bg-secondary/40 absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ contain: "layout" }}
      />

      <div className="relative z-10 container mx-auto mt-4 px-4 py-20">
        <div className="flex min-h-[80vh] flex-col items-center gap-12 lg:flex-row">
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
              className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">{t("landing.hero.tagline")}</span>
            </motion.div>

            <motion.h1
              className="mb-6 text-4xl leading-tight font-bold md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t("landing.hero.title")}
              <span className="text-gradient"> {t("landing.hero.titleHighlight")}</span>
            </motion.h1>

            <motion.p
              className="text-muted-foreground mx-auto mb-8 max-w-xl text-lg md:text-xl lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {t("landing.hero.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent/30 hover:shadow-accent/40 rounded-full px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
                  aria-label={t("landing.hero.ctaPrimary")}
                >
                  <MapPin className="h-5 w-5 sm:mr-2" />
                  <span className="sm:inline">{t("landing.hero.ctaPrimary")}</span>
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 px-8 py-6 text-lg font-semibold"
                >
                  {t("landing.hero.ctaSecondary")}
                </Button>
              </Link>
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
                className="bg-card border-foreground/10 relative mx-auto max-w-sm rounded-[3rem] border-8 p-3 shadow-2xl"
                whileHover={{ y: -10, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="from-primary/20 via-secondary to-accent/20 aspect-9/16 overflow-hidden rounded-[2.5rem] bg-linear-to-br">
                  {/* Mock app content */}
                  <div className="flex h-full flex-col p-4">
                    <div className="bg-background/80 mb-3 rounded-2xl p-3 backdrop-blur">
                      <p className="text-foreground text-sm font-semibold">📍 Hà Nội Trip</p>
                      <p className="text-muted-foreground text-xs">3 ngày • 5 điểm đến</p>
                    </div>

                    {/* Map placeholder */}
                    <div className="bg-secondary/50 relative flex-1 overflow-hidden rounded-2xl">
                      <div className="from-primary/30 to-accent/30 absolute inset-0 bg-linear-to-br" />
                      {/* Route lines */}
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
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
                        className="bg-accent absolute top-[25%] left-[18%] flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-xs">1</span>
                      </motion.div>
                      <motion.div
                        className="bg-primary absolute top-[40%] left-[45%] flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 0.3,
                        }}
                      >
                        <span className="text-primary-foreground text-xs">2</span>
                      </motion.div>
                      <motion.div
                        className="bg-accent absolute top-[55%] right-[18%] flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
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
                      <div className="bg-background/80 flex items-center gap-2 rounded-xl p-2 backdrop-blur">
                        <div className="bg-accent/20 flex h-8 w-8 items-center justify-center rounded-lg">
                          🏛️
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">Văn Miếu</p>
                          <p className="text-muted-foreground text-[10px]">9:00 - 11:00</p>
                        </div>
                      </div>
                      <div className="bg-background/80 flex items-center gap-2 rounded-xl p-2 backdrop-blur">
                        <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                          🌸
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">Hồ Hoàn Kiếm</p>
                          <p className="text-muted-foreground text-[10px]">14:00 - 16:00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                className="bg-accent text-accent-foreground absolute -top-4 -right-4 rounded-full px-4 py-2 text-sm font-medium shadow-lg"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎯 Tối ưu lộ trình
              </motion.div>
              <motion.div
                className="bg-primary text-primary-foreground absolute -bottom-4 -left-4 rounded-full px-4 py-2 text-sm font-medium shadow-lg"
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

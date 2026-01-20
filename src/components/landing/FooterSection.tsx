"use client";

import { motion } from "framer-motion";
import { MapPin, Mail, Phone, Facebook, Instagram, Youtube, Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FooterSection = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-background text-foreground">
      {/* CTA Section */}
      <section className="from-primary via-primary to-accent relative overflow-hidden bg-linear-to-br py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

        <div className="relative z-10 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-6 text-6xl"
            >
              ✈️
            </motion.div>
            <h2 className="mb-4 text-3xl font-bold md:text-5xl">
              {t("landing.footer.ctaTitle")}
              <br />
              <span className="text-white/90">{t("landing.footer.ctaSubtitle")}</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-white/80">
              {t("landing.footer.ctaDescription")}
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="text-primary rounded-full bg-white px-10 py-7 text-lg font-bold shadow-2xl hover:bg-white/90"
                  aria-label={t("landing.footer.ctaButton")}
                >
                  <MapPin className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">{t("landing.footer.ctaButton")}</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-xl">
                  <MapPin className="text-primary-foreground h-6 w-6" />
                </div>
                <span className="text-foreground text-2xl font-bold">Vivu Go</span>
              </div>
              <p className="text-foreground/70 mb-6 max-w-md">
                Công cụ lên kế hoạch du lịch thông minh, giúp bạn tự thiết lập lịch trình, tối ưu
                đường đi và quản lý chi phí cho mọi chuyến đi.
              </p>
              <div className="flex gap-3">
                {[Facebook, Instagram, Youtube, Github].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="bg-foreground/10 hover:bg-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                  >
                    <Icon className="text-foreground h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 text-lg font-semibold">{t("landing.footer.quickLinks")}</h4>
              <ul className="space-y-3">
                {[
                  t("common.home"),
                  t("landing.features.title"),
                  t("landing.hero.ctaSecondary"),
                  t("landing.footer.guide", "Hướng dẫn"),
                  t("landing.footer.contact"),
                ].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/70 hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 text-lg font-semibold">{t("landing.footer.contact")}</h4>
              <ul className="space-y-3">
                <li className="text-foreground/70 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>hello@vivu.go</span>
                </li>
                <li className="text-foreground/70 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+84 909 090 909</span>
                </li>
                <li className="text-foreground/70 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Hà Nội, Việt Nam</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-foreground/10 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
            <p className="text-foreground/50 text-sm">{t("landing.footer.copyright")}</p>
            <div className="text-foreground/50 flex gap-6 text-sm">
              <a href="#" className="hover:text-primary transition-colors">
                {t("landing.footer.terms")}
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                {t("landing.footer.privacy")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

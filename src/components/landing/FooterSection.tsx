"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Youtube,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FooterSection = () => {
  return (
    <footer className="bg-background text-foreground">
      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-primary via-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              ✈️
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Chuyến đi tiếp theo của bạn
              <br />
              <span className="text-white/90">bắt đầu từ đây</span>
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Đừng để việc lên kế hoạch làm bạn mệt mỏi. Hãy để chúng tôi giúp
              bạn tận hưởng từng khoảnh khắc.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-7 text-lg font-bold shadow-2xl"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Bắt đầu lên lịch ngay
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Links */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold text-foreground">
                  Vivu Go
                </span>
              </div>
              <p className="text-foreground/70 mb-6 max-w-md">
                Công cụ lên kế hoạch du lịch thông minh, giúp bạn tự thiết lập
                lịch trình, tối ưu đường đi và quản lý chi phí cho mọi chuyến
                đi.
              </p>
              <div className="flex gap-3">
                {[Facebook, Instagram, Youtube, Github].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors"
                  >
                    <Icon className="w-5 h-5 text-foreground" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Liên kết nhanh</h4>
              <ul className="space-y-3">
                {["Trang chủ", "Tính năng", "Demo", "Hướng dẫn", "Liên hệ"].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-foreground/70 hover:text-primary transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Liên hệ</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-foreground/70">
                  <Mail className="w-4 h-4" />
                  <span>hello@vivu.go</span>
                </li>
                <li className="flex items-center gap-2 text-foreground/70">
                  <Phone className="w-4 h-4" />
                  <span>+84 909 090 909</span>
                </li>
                <li className="flex items-center gap-2 text-foreground/70">
                  <MapPin className="w-4 h-4" />
                  <span>Hà Nội, Việt Nam</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-foreground/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-foreground/50 text-sm">
              © 2024 Vivu Go. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex gap-6 text-sm text-foreground/50">
              <a href="#" className="hover:text-primary transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

"use client";

import { motion } from "framer-motion";
import { X, Check, ArrowRight } from "lucide-react";

const painPoints = [
  {
    before: "Mất hàng giờ tìm địa chỉ và ghi chép thủ công",
    after: "Tọa độ chính xác, lưu tự động trên cloud",
  },
  {
    before: "Tính tiền cơm chia cho cả nhóm rối như tơ vò",
    after: "Chi phí minh bạch, chia tự động cho từng người",
  },
  {
    before: "Không biết đi đường nào cho nhanh và tiết kiệm",
    after: "Lộ trình tối ưu, tiết kiệm thời gian di chuyển",
  },
  {
    before: "Quên mất địa điểm hay bị lạc giữa đường",
    after: "Bản đồ trực quan, dẫn đường từng bước",
  },
];

const PainPointsSection = () => {
  return (
    <section className="py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Giải quyết mọi <span className="text-gradient">vấn đề</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Chúng tôi hiểu những khó khăn bạn gặp phải khi lên kế hoạch du lịch
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Before */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex-1 bg-destructive/10 rounded-2xl p-5 border border-destructive/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center shrink-0">
                      <X className="w-4 h-4 text-destructive" />
                    </div>
                    <p className="text-foreground">{point.before}</p>
                  </div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-primary"
                >
                  <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
                </motion.div>

                {/* After */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex-1 bg-primary/10 rounded-2xl p-5 border border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-foreground font-medium">{point.after}</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-linear-to-r from-primary to-accent rounded-3xl p-8 text-white shadow-2xl">
            <p className="text-xl md:text-2xl font-semibold mb-2">
              ✨ Mọi thứ gói gọn trong một màn hình
            </p>
            <p className="text-white/80">
              Tọa độ chính xác • Chi phí minh bạch • Lộ trình tối ưu
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PainPointsSection;

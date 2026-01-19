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
    <section className="bg-muted/30 overflow-hidden py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Giải quyết mọi <span className="text-gradient">vấn đề</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Chúng tôi hiểu những khó khăn bạn gặp phải khi lên kế hoạch du lịch
          </p>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="mb-6"
            >
              <div className="flex flex-col items-center gap-4 md:flex-row">
                {/* Before */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-destructive/10 border-destructive/20 flex-1 rounded-2xl border p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-destructive/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <X className="text-destructive h-4 w-4" />
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
                  <ArrowRight className="h-6 w-6 rotate-90 md:rotate-0" />
                </motion.div>

                {/* After */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-primary/10 border-primary/20 flex-1 rounded-2xl border p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <Check className="text-primary h-4 w-4" />
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
          <div className="from-primary to-accent inline-block rounded-3xl bg-linear-to-r p-8 text-white shadow-2xl">
            <p className="mb-2 text-xl font-semibold md:text-2xl">
              ✨ Mọi thứ gói gọn trong một màn hình
            </p>
            <p className="text-white/80">Tọa độ chính xác • Chi phí minh bạch • Lộ trình tối ưu</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PainPointsSection;

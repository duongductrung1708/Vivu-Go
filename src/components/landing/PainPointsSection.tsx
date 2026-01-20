"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { X, Check, ArrowRight } from "lucide-react";

const PainPointsSection = () => {
  const { t } = useTranslation();

  const painPoints = useMemo(
    () => [
      {
        before: t(
          "landing.painPoints.point1.before",
          "Mất hàng giờ tìm địa chỉ và ghi chép thủ công",
        ),
        after: t("landing.painPoints.point1.after", "Tọa độ chính xác, lưu tự động trên cloud"),
      },
      {
        before: t(
          "landing.painPoints.point2.before",
          "Tính tiền cơm chia cho cả nhóm rối như tơ vò",
        ),
        after: t(
          "landing.painPoints.point2.after",
          "Chi phí minh bạch, chia tự động cho từng người",
        ),
      },
      {
        before: t(
          "landing.painPoints.point3.before",
          "Không biết đi đường nào cho nhanh và tiết kiệm",
        ),
        after: t(
          "landing.painPoints.point3.after",
          "Lộ trình tối ưu, tiết kiệm thời gian di chuyển",
        ),
      },
      {
        before: t("landing.painPoints.point4.before", "Quên mất địa điểm hay bị lạc giữa đường"),
        after: t("landing.painPoints.point4.after", "Bản đồ trực quan, dẫn đường từng bước"),
      },
    ],
    [t],
  );

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
            {t("landing.painPoints.title")}{" "}
            <span className="text-gradient">
              {t("landing.painPoints.titleHighlight", "vấn đề")}
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            {t("landing.painPoints.description")}
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
              ✨ {t("landing.painPoints.summary.title", "Mọi thứ gói gọn trong một màn hình")}
            </p>
            <p className="text-white/80">
              {t(
                "landing.painPoints.summary.description",
                "Tọa độ chính xác • Chi phí minh bạch • Lộ trình tối ưu",
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PainPointsSection;

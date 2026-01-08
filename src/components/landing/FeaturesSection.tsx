"use client";

import { motion } from "framer-motion";
import { Calendar, Map, Wallet, Database } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Lịch trình linh hoạt",
    description:
      "Không giới hạn số ngày hay số người. Tự do thêm, bớt và kéo thả địa điểm.",
    color: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  {
    icon: Map,
    title: "Bản đồ thông minh",
    description: "Tự động vẽ lộ trình ngắn nhất giữa các điểm tham quan.",
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Wallet,
    title: "Quản lý ngân sách",
    description: "Tự động tính toán chi phí trung bình trên mỗi thành viên.",
    color: "bg-accent/10",
    iconColor: "text-accent",
  },
  {
    icon: Database,
    title: "Dữ liệu chính xác",
    description:
      "Tích hợp tìm kiếm địa điểm từ các nguồn mở uy tín, bao quát từ phố cổ đến ngoại ô.",
    color: "bg-[hsl(var(--lavender))]",
    iconColor: "text-[hsl(var(--lavender-foreground))]",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tại sao chọn <span className="text-gradient">chúng tôi?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tất cả những gì bạn cần để có một chuyến đi hoàn hảo, gói gọn trong
            một ứng dụng.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-card rounded-3xl p-6 shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300"
            >
              <motion.div
                className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-4`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

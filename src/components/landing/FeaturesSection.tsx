"use client";

import { motion } from "framer-motion";
import { Calendar, Map, Wallet, Database } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Lịch trình linh hoạt",
    description: "Không giới hạn số ngày hay số người. Tự do thêm, bớt và kéo thả địa điểm.",
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
    <section className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Tại sao chọn <span className="text-gradient">chúng tôi?</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Tất cả những gì bạn cần để có một chuyến đi hoàn hảo, gói gọn trong một ứng dụng.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-card border-border/50 rounded-3xl border p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <motion.div
                className={`h-14 w-14 ${feature.color} mb-4 flex items-center justify-center rounded-2xl`}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
              </motion.div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

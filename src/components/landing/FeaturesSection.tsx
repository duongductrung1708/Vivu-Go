"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Calendar, Map, Wallet, Database } from "lucide-react";

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
  const { t } = useTranslation();

  const features = [
    {
      icon: Calendar,
      title: t("landing.features.flexibleSchedule.title"),
      description: t("landing.features.flexibleSchedule.description"),
      color: "bg-secondary",
      iconColor: "text-secondary-foreground",
    },
    {
      icon: Map,
      title: t("landing.features.smartMap.title"),
      description: t("landing.features.smartMap.description"),
      color: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: Wallet,
      title: t("landing.features.budgetManagement.title"),
      description: t("landing.features.budgetManagement.description"),
      color: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      icon: Database,
      title: t("landing.features.accurateData.title"),
      description: t("landing.features.accurateData.description"),
      color: "bg-[hsl(var(--lavender))]",
      iconColor: "text-[hsl(var(--lavender-foreground))]",
    },
  ];

  return (
    <section className="bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t("landing.features.title")}</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            {t("landing.features.description")}
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

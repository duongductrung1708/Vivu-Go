import { lazy, Suspense } from "react";
import HeroSection from "@/components/landing/HeroSection";

// Lazy load non-critical sections below the fold to improve initial load
const FeaturesSection = lazy(() =>
  import("@/components/landing/FeaturesSection").then((m) => ({ default: m.default })),
);
const DemoSection = lazy(() =>
  import("@/components/landing/DemoSection").then((m) => ({ default: m.default })),
);
const PainPointsSection = lazy(() =>
  import("@/components/landing/PainPointsSection").then((m) => ({ default: m.default })),
);
const FooterSection = lazy(() =>
  import("@/components/landing/FooterSection").then((m) => ({ default: m.default })),
);

const Index = () => {
  return (
    <main>
      {/* Critical above-the-fold content - load immediately */}
      <HeroSection />
      {/* Below-the-fold content - lazy load */}
      <Suspense fallback={null}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={null}>
        <DemoSection />
      </Suspense>
      <Suspense fallback={null}>
        <PainPointsSection />
      </Suspense>
      <Suspense fallback={null}>
        <FooterSection />
      </Suspense>
    </main>
  );
};

export default Index;

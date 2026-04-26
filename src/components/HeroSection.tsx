import { useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplineScene } from "@/components/ui/splite";
import { trackCTA } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

export default function HeroSection() {
  const { t } = useTranslation();
  // Ref to the 3D scene container — used to calculate cursor position relative to center
  const containerRef = useRef<HTMLDivElement>(null);

  // Raw mouse position values (updated instantly on mouse move)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smoothed (spring-based) versions of mouse position — creates the elastic "follow" effect
  // stiffness: 150 = how fast it catches up; damping: 20 = how quickly it stops oscillating
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  // PARALLAX MOVEMENT: Calculates how far the cursor is from the container center
  // and maps it to a ±15px offset for the floating badge
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Find the center point of the container
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Normalize cursor distance from center to [-15, +15] range
    const dx = (e.clientX - cx) / (rect.width / 2) * 15;
    const dy = (e.clientY - cy) / (rect.height / 2) * 15;
    mouseX.set(dx);
    mouseY.set(dy);
  }, [mouseX, mouseY]);

  // RESET: When cursor leaves, badge springs back to center (0, 0)
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section className="hero-gradient relative overflow-hidden">
      {/* BACKGROUND AMBIENT GLOW BLOBS — decorative, no animation, pure CSS blur */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right accent glow */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[100px]" />
        {/* Bottom-left info-color glow */}
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-info/5 blur-[80px]" />
        {/* Center accent glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/3 blur-[120px]" />
      </div>
      {/* GRID OVERLAY — subtle white grid lines for depth */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />
      <div className="container-tight px-4 pt-20 md:pt-28 pb-0 relative z-10 min-h-[600px]">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-4">
          {/* LEFT COLUMN — text content, no animation */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-primary-foreground leading-[1.3] mb-6">
              {t("hero.title1")}
              <br />
              <span className="text-gradient-accent">{t("hero.title2")}</span>
            </h1>
            <p className="text-base md:text-lg text-primary-foreground/60 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button
                size="lg"
                className="accent-gradient border-0 text-accent-foreground text-base px-8 h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto font-semibold"
                asChild
                onClick={() => trackCTA("hero_check_eligibility")}>
                <Link to="/eligibility">
                  {t("cta.checkEligibility")}
                  <ArrowRight className="ml-2" size={18} />
                </Link>
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN — 3D scene + floating badge */}
          {/* Mouse events on this container drive the parallax badge movement */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="flex-1 relative w-full h-[400px] md:h-[500px] lg:h-[550px]">

            {/* SPLINE 3D ROBOT — interactive WebGL scene, renders its own animations */}
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full" />

            {/* FLOATING BADGE — combines two independent movements:
                1. PARALLAX (springX/springY): badge follows cursor with elastic spring physics
                2. BOBBING (animate.y): continuous up-down oscillation [0 → -10 → 0] over 3s */}
            <motion.div
              className="absolute top-1/2 left-1/2 pointer-events-none z-10"
              style={{
                x: springX,          // Horizontal parallax offset (spring-smoothed)
                y: springY,          // Vertical parallax offset (spring-smoothed)
                translateX: "-50%",  // Center the badge horizontally
                translateY: "-50%",  // Center the badge vertically
              }}
              animate={{ y: [0, -8, 0] }}  // BOBBING: 8px float up-and-down loop
              transition={{
                repeat: Infinity,     // Loop forever
                duration: 3,          // One full bob cycle = 3 seconds
                ease: "easeInOut",    // Smooth acceleration/deceleration
              }}>
              {/* Glass-morphism card with brand text */}
              <div className="glass-effect px-6 py-3 rounded-2xl border-0">
                <span className="text-lg md:text-xl font-black text-primary-foreground tracking-tight">
                  Vark<span className="text-gradient-accent">Online</span><span className="text-primary-foreground/60 font-medium">.am</span>
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

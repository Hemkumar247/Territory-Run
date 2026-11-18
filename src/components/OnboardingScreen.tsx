import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform, PanInfo } from 'framer-motion';
import { 
  Map, 
  Navigation, 
  Trophy, 
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Users,
  Zap,
  Crown,
  Crosshair,
  ArrowRight
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

// Territory Run theme - using your tokens
const THEME = {
  background: '#080B12',
  surface: '#0D1117',
  primary: '#00E5FF',
  secondary: '#7B2FFF',
  accent: '#FF3CAC',
  success: '#00FF88',
  warning: '#FFB800',
  white: '#F0F4FF',
  muted: 'rgba(240, 244, 255, 0.55)',
};

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  stats?: { label: string; value: string }[];
}

const slides: SlideData[] = [
  {
    id: 0,
    title: 'CLAIM YOUR TERRITORY',
    subtitle: 'Transform Every Run',
    description: 'Your city is the game board. Run to capture territory and build your empire. The more you run, the bigger your kingdom grows.',
    icon: <Map className="w-12 h-12" />,
    gradient: 'from-[#00E5FF] to-[#00E5FF]/30',
    accentColor: '#00E5FF',
    stats: [
      { label: 'Territory', value: 'EXPAND' },
      { label: 'Empire', value: 'BUILD' },
    ]
  },
  {
    id: 1,
    title: 'CHASE THE LEADERBOARD',
    subtitle: 'Compete & Conquer',
    description: 'Real-time global rankings. Challenge friends and rivals. Every kilometer counts towards your dominance.',
    icon: <Trophy className="w-12 h-12" />,
    gradient: 'from-[#FF3CAC] to-[#FF3CAC]/30',
    accentColor: '#FF3CAC',
    stats: [
      { label: 'Rank', value: 'CLIMB' },
      { label: 'Glory', value: 'EARN' },
    ]
  },
  {
    id: 2,
    title: 'GPS TERRITORY MAPPING',
    subtitle: 'Precision Tracking',
    description: 'Advanced GPS technology maps your run in real-time. Watch as your territory expands with every step you take.',
    icon: <Crosshair className="w-12 h-12" />,
    gradient: 'from-[#7B2FFF] to-[#7B2FFF]/30',
    accentColor: '#7B2FFF',
    stats: [
      { label: 'Real-time', value: 'TRACK' },
      { label: 'Area', value: 'CAPTURE' },
    ]
  },
  {
    id: 3,
    title: 'READY TO DOMINATE?',
    subtitle: 'Start Building Now',
    description: 'Your empire awaits. Put on your shoes and start claiming territory today. The city is yours for the taking.',
    icon: <Zap className="w-12 h-12" />,
    gradient: 'from-[#FFB800] to-[#FFB800]/30',
    accentColor: '#FFB800',
    stats: [
      { label: 'Start', value: 'NOW' },
      { label: 'Empire', value: 'AWAITS' },
    ]
  },
];

// Decorative background SVGs
const DecorativePattern: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-3xl" />
    <div className="absolute bottom-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-white/[0.02] to-transparent blur-3xl" />
    <svg className="absolute top-[10%] right-[10%] w-32 h-32 opacity-[0.03]" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" fill="none" />
      <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.5" fill="none" />
      <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="0.5" fill="none" />
    </svg>
    <svg className="absolute bottom-[20%] left-[5%] w-24 h-24 opacity-[0.03]" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" stroke="white" strokeWidth="0.5" fill="none" transform="rotate(45 50 50)" />
    </svg>
  </div>
);

// Floating particles animation
const FloatingParticles: React.FC<{accentColor: string}> = ({ accentColor }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{ 
          backgroundColor: accentColor,
          left: `${15 + (i * 15)}%`,
          top: `${20 + (i % 3) * 25}%`,
          opacity: 0.3
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3 + i * 0.5,
          repeat: Infinity,
          delay: i * 0.3,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

// Progress dots
const ProgressDots: React.FC<{ total: number; current: number; orientation?: 'vertical' | 'horizontal' }> = ({ 
  total, 
  current,
  orientation = 'horizontal'
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <div className={`flex ${isVertical ? 'flex-col gap-3' : 'flex-row gap-2'} items-center`}>
      {[...Array(total)].map((_, index) => (
        <motion.div
          key={index}
          className={`rounded-full transition-all duration-500 ${
            isVertical ? 'w-1 h-8' : 'h-1'
          } ${index === current ? (isVertical ? 'bg-white' : 'w-8 bg-white') : (isVertical ? 'bg-white/20' : 'w-2 bg-white/30')}`}
          animate={{
            backgroundColor: index === current ? '#fff' : 'rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  );
};

// Individual Slide Component
const Slide: React.FC<{ 
  data: SlideData; 
  isActive: boolean;
  onDragEnd: (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}> = ({ data, isActive, onDragEnd }) => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : 0, 
        y: isActive ? 0 : 20,
        scale: isActive ? 1 : 0.95
      }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Floating Particles */}
      <FloatingParticles accentColor={data.accentColor} />
      
      {/* Icon Container with Glow */}
      <motion.div 
        className="relative mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        style={{ color: data.accentColor }}
      >
        <div className="absolute inset-0 blur-2xl scale-150" style={{ backgroundColor: `${data.accentColor}40` }} />
        <div className="relative w-24 h-24 rounded-3xl bg-white/[0.05] border border-white/10 flex items-center justify-center backdrop-blur-xl">
          {data.icon}
        </div>
        {/* Orbit rings */}
        <motion.div
          className="absolute inset-[-20px] border border-white/10 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-center mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span 
          className="text-sm font-bold tracking-[0.3em] uppercase"
          style={{ color: data.accentColor }}
        >
          {data.subtitle}
        </span>
      </motion.h1>

      <motion.h2 
        className="text-[32px] font-bold text-white text-center mb-6 tracking-tight leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {data.title}
      </motion.h2>

      {/* Stats Row */}
      <motion.div 
        className="flex gap-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {data.stats?.map((stat, idx) => (
          <div key={idx} className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">{stat.label}</p>
            <p className="text-lg font-bold" style={{ color: data.accentColor }}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Description */}
      <motion.p 
        className="text-sm text-white/60 text-center max-w-[280px] leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {data.description}
      </motion.p>
    </motion.div>
  );
};

// Main Onboarding Component
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const slideX = useSpring(0, { stiffness: 300, damping: 30 });

  const goToSlide = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    slideX.set(-index * 100);
  };

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      goToSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      nextSlide();
    } else if (info.offset.x > threshold) {
      prevSlide();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === ' ' || e.key === 'Enter') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ backgroundColor: THEME.background }}
    >
      {/* Decorative Background */}
      <DecorativePattern />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${slides[currentSlide].accentColor}20, transparent)`,
        }}
      />

      {/* Content Container */}
      <div className="relative h-full flex flex-col">
        {/* Skip Button */}
        <div className="absolute top-12 right-6 z-10">
          <motion.button
            onClick={onComplete}
            className="px-4 py-2 text-xs font-medium text-white/40 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Skip
          </motion.button>
        </div>

        {/* Slides Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <Slide 
              key={currentSlide}
              data={slides[currentSlide]} 
              isActive={true}
              onDragEnd={handleDragEnd}
            />
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="pb-12 px-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {/* Vertical Progress Dots */}
            <div className="flex-1 flex justify-center">
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4">
            {/* Previous Button (hidden on first slide) */}
            {currentSlide > 0 ? (
              <motion.button
                onClick={prevSlide}
                className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
            ) : (
              <div className="w-14 h-14" />
            )}

            {/* Next/Complete Button */}
            <motion.button
              onClick={nextSlide}
              className="flex-1 h-14 rounded-full flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-wider transition-all"
              style={{ 
                backgroundColor: slides[currentSlide].accentColor,
                color: '#000',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  Start Running
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>

          {/* Page Counter */}
          <div className="mt-4 text-center">
            <span 
              className="text-xs font-medium tracking-wider"
              style={{ color: slides[currentSlide].accentColor }}
            >
              {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingScreen;

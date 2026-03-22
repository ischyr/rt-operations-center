import { useState, useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const rand = (min, max) => Math.random() * (max - min) + min;

// 4-pointed star shape
const STAR_PATH = 'polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)';

const COLORS = ['#ffffff', '#ffd700', '#ffe680', '#ffaaaa', '#e0c8ff'];

const makeSparkle = (id) => ({
  id,
  top:    `${rand(-18, 118)}%`,
  left:   `${rand(-6, 106)}%`,
  size:   rand(6, 15),
  color:  COLORS[Math.floor(Math.random() * COLORS.length)],
  delay:  rand(0, 0.18),
});

const Sparkle = ({ top, left, size, color, delay }) => (
  <motion.div
    style={{ position: 'absolute', top, left, pointerEvents: 'none', zIndex: 10 }}
    initial={{ scale: 0, opacity: 0, rotate: 0 }}
    animate={{ scale: [0, 1, 0.6, 0], opacity: [0, 1, 0.8, 0], rotate: [0, 72, 144] }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ duration: 0.75, delay, ease: 'easeInOut' }}
  >
    <Box
      w={`${size}px`}
      h={`${size}px`}
      clipPath={STAR_PATH}
      bg={color}
      filter={`drop-shadow(0 0 ${size * 0.6}px ${color})`}
    />
  </motion.div>
);

const SparkleQuote = ({ children }) => {
  const [sparkles, setSparkles] = useState([]);
  const [hovered, setHovered]   = useState(false);
  const counterRef = useRef(0);
  const intervalRef = useRef(null);

  const burst = () => {
    const batch = Array.from({ length: 7 }, () => {
      counterRef.current += 1;
      return makeSparkle(counterRef.current);
    });
    setSparkles((prev) => [...prev, ...batch]);
    // prune old ones so the array doesn't grow unbounded
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !batch.find((b) => b.id === s.id)));
    }, 900);
  };

  useEffect(() => {
    if (hovered) {
      burst();
      intervalRef.current = setInterval(burst, 700);
    } else {
      clearInterval(intervalRef.current);
      setSparkles([]);
    }
    return () => clearInterval(intervalRef.current);
  }, [hovered]);

  return (
    <Box
      pos="relative"
      display="inline-block"
      cursor="default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {sparkles.map((s) => (
          <Sparkle key={s.id} {...s} />
        ))}
      </AnimatePresence>
      {children}
    </Box>
  );
};

export default SparkleQuote;

import { Box } from '@chakra-ui/react';

const hex     = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
const diamond = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
const tri     = 'polygon(50% 0%, 0% 100%, 100% 100%)';
const triDown = 'polygon(0% 0%, 100% 0%, 50% 100%)';

const HexOutline = ({ size, opacity = 0.25, bg = '#111111' }) => {
  const h = Math.round(size * 1.155);
  return (
    <Box pos="relative" w={`${size}px`} h={`${h}px`}>
      <Box pos="absolute" inset="0"  clipPath={hex} bg={`rgba(252,129,129,${opacity})`} />
      <Box pos="absolute" inset="2px" clipPath={hex} bg={bg} />
    </Box>
  );
};

const Dot = ({ size, opacity = 0.45 }) => (
  <Box w={`${size}px`} h={`${size}px`} borderRadius="full" bg={`rgba(252,129,129,${opacity})`} />
);

const Line = ({ vertical, length, opacity = 0.2 }) => (
  <Box
    w={vertical ? '1px' : `${length}px`}
    h={vertical ? `${length}px` : '1px'}
    bg={`rgba(252,129,129,${opacity})`}
  />
);

const leftShapes = [
  { top: '1%',  ml: 25,  el: <Dot size={6}  opacity={0.38} /> },
  { top: '3%',  ml: 8,   el: <HexOutline size={88}  opacity={0.22} /> },
  { top: '8%',  ml: 72,  el: <Box w="20px" h="20px" clipPath={diamond} bg="rgba(252,129,129,0.2)" /> },
  { top: '11%', ml: 30,  el: <Line length={60} opacity={0.16} /> },
  { top: '14%', ml: 12,  el: <Box w="28px" h="28px" clipPath={tri} bg="rgba(252,129,129,0.13)" /> },
  { top: '17%', ml: 62,  el: <Dot size={4}  opacity={0.28} /> },
  { top: '20%', ml: 18,  el: <HexOutline size={60}  opacity={0.18} /> },
  { top: '24%', ml: 78,  el: <Box w="16px" h="16px" clipPath={triDown} bg="rgba(252,129,129,0.17)" /> },
  { top: '27%', ml: 42,  el: <Line vertical length={48} opacity={0.15} /> },
  { top: '31%', ml: 6,   el: <HexOutline size={104} opacity={0.19} /> },
  { top: '36%', ml: 82,  el: <Dot size={8}  opacity={0.36} /> },
  { top: '39%', ml: 28,  el: <Box w="34px" h="34px" clipPath={diamond} bg="rgba(252,129,129,0.15)" /> },
  { top: '42%', ml: 14,  el: <Line length={70} opacity={0.16} /> },
  { top: '45%', ml: 52,  el: <Box w="24px" h="24px" clipPath={tri} bg="rgba(252,129,129,0.13)" /> },
  { top: '48%', ml: 22,  el: <HexOutline size={70}  opacity={0.2} /> },
  { top: '52%', ml: 76,  el: <Dot size={5}  opacity={0.27} /> },
  { top: '55%', ml: 36,  el: <Line vertical length={42} opacity={0.14} /> },
  { top: '58%', ml: 10,  el: <Box w="42px" h="48px" clipPath={hex} bg="rgba(252,129,129,0.08)" /> },
  { top: '62%', ml: 67,  el: <Box w="18px" h="18px" clipPath={triDown} bg="rgba(252,129,129,0.18)" /> },
  { top: '65%', ml: 18,  el: <HexOutline size={78}  opacity={0.17} /> },
  { top: '69%', ml: 74,  el: <Dot size={7}  opacity={0.34} /> },
  { top: '72%', ml: 22,  el: <Line length={58} opacity={0.15} /> },
  { top: '75%', ml: 7,   el: <Box w="28px" h="28px" clipPath={diamond} bg="rgba(252,129,129,0.16)" /> },
  { top: '78%', ml: 56,  el: <HexOutline size={54}  opacity={0.19} /> },
  { top: '82%', ml: 27,  el: <Box w="22px" h="22px" clipPath={tri} bg="rgba(252,129,129,0.12)" /> },
  { top: '85%', ml: 71,  el: <Dot size={5}  opacity={0.24} /> },
  { top: '88%', ml: 12,  el: <Line length={66} opacity={0.14} /> },
  { top: '91%', ml: 33,  el: <HexOutline size={62}  opacity={0.16} /> },
  { top: '94%', ml: 77,  el: <Box w="14px" h="14px" clipPath={diamond} bg="rgba(252,129,129,0.19)" /> },
  { top: '97%', ml: 44,  el: <Dot size={6}  opacity={0.29} /> },
];

const rightShapes = leftShapes.map((s) => ({ ...s, ml: 110 - s.ml }));

const ShapeSet = ({ side }) => {
  const L      = side === 'left';
  const shapes = L ? leftShapes : rightShapes;

  return (
    <Box
      pos="absolute"
      top="0"
      bottom="0"
      {...(L ? { left: '-68px' } : { right: '-68px' })}
      display={{ base: 'none', xl: 'block' }}
      pointerEvents="none"
      zIndex={0}
      w="120px"
    >
      {shapes.map((s, i) => (
        <Box key={i} pos="absolute" top={s.top} left={`${s.ml}px`}>
          {s.el}
        </Box>
      ))}
    </Box>
  );
};

const PricingShapes = () => (
  <>
    <ShapeSet side="left" />
    <ShapeSet side="right" />
  </>
);

export default PricingShapes;

import { Box } from '@chakra-ui/react';

const hex     = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
const diamond = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
const tri     = 'polygon(50% 0%, 0% 100%, 100% 100%)';
const triDown = 'polygon(0% 0%, 100% 0%, 50% 100%)';

const HexOutline = ({ size, opacity = 0.25, bg = '#111111' }) => {
  const h = Math.round(size * 1.155);
  return (
    <Box pos="relative" w={`${size}px`} h={`${h}px`}>
      <Box pos="absolute" inset="0" clipPath={hex} bg={`rgba(252,129,129,${opacity})`} />
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

// Each entry: { top: '_%', ml: px offset from the shape column edge, node }
const leftShapes = [
  { top: '1%',   ml: 10,  el: <HexOutline size={80}  opacity={0.22} /> },
  { top: '5%',   ml: 80,  el: <Dot size={6}  opacity={0.4} /> },
  { top: '8%',   ml: 20,  el: <Box w="28px" h="28px" clipPath={diamond} bg="rgba(252,129,129,0.18)" /> },
  { top: '11%',  ml: 55,  el: <Line length={60} opacity={0.18} /> },
  { top: '14%',  ml: 30,  el: <Box w="40px" h="40px" clipPath={tri} bg="rgba(252,129,129,0.13)" /> },
  { top: '18%',  ml: 5,   el: <HexOutline size={56}  opacity={0.2} /> },
  { top: '21%',  ml: 70,  el: <Dot size={5}  opacity={0.3} /> },
  { top: '24%',  ml: 15,  el: <Box w="22px" h="22px" clipPath={triDown} bg="rgba(252,129,129,0.17)" /> },
  { top: '27%',  ml: 50,  el: <Line vertical length={44} opacity={0.16} /> },
  { top: '31%',  ml: 20,  el: <Box w="48px" h="56px" clipPath={hex} bg="rgba(252,129,129,0.08)" /> },
  { top: '35%',  ml: 75,  el: <Dot size={8}  opacity={0.35} /> },
  { top: '38%',  ml: 10,  el: <HexOutline size={96}  opacity={0.2} /> },
  { top: '43%',  ml: 60,  el: <Box w="24px" h="24px" clipPath={diamond} bg="rgba(252,129,129,0.22)" /> },
  { top: '46%',  ml: 25,  el: <Line length={70} opacity={0.15} /> },
  { top: '49%',  ml: 5,   el: <Box w="34px" h="34px" clipPath={tri} bg="rgba(252,129,129,0.14)" /> },
  { top: '52%',  ml: 55,  el: <Dot size={5}  opacity={0.28} /> },
  { top: '55%',  ml: 20,  el: <HexOutline size={64}  opacity={0.19} /> },
  { top: '59%',  ml: 80,  el: <Box w="18px" h="18px" clipPath={triDown} bg="rgba(252,129,129,0.2)" /> },
  { top: '62%',  ml: 40,  el: <Line vertical length={50} opacity={0.15} /> },
  { top: '66%',  ml: 10,  el: <Box w="42px" h="42px" clipPath={diamond} bg="rgba(252,129,129,0.12)" /> },
  { top: '69%',  ml: 65,  el: <Dot size={7}  opacity={0.38} /> },
  { top: '72%',  ml: 5,   el: <HexOutline size={80}  opacity={0.18} /> },
  { top: '76%',  ml: 50,  el: <Box w="26px" h="26px" clipPath={tri} bg="rgba(252,129,129,0.15)" /> },
  { top: '79%',  ml: 20,  el: <Line length={65} opacity={0.16} /> },
  { top: '82%',  ml: 70,  el: <Dot size={5}  opacity={0.25} /> },
  { top: '85%',  ml: 15,  el: <HexOutline size={52}  opacity={0.21} /> },
  { top: '88%',  ml: 60,  el: <Box w="20px" h="20px" clipPath={diamond} bg="rgba(252,129,129,0.18)" /> },
  { top: '91%',  ml: 25,  el: <Line vertical length={38} opacity={0.14} /> },
  { top: '94%',  ml: 10,  el: <Box w="36px" h="42px" clipPath={hex} bg="rgba(252,129,129,0.09)" /> },
  { top: '97%',  ml: 65,  el: <Dot size={6}  opacity={0.3} /> },
];

// Mirror ml for right side (120px column width)
const rightShapes = leftShapes.map((s) => ({ ...s, ml: 110 - s.ml }));

const ShapeSet = ({ side }) => {
  const L = side === 'left';
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

const OperatorShapes = () => (
  <>
    <ShapeSet side="left" />
    <ShapeSet side="right" />
  </>
);

export default OperatorShapes;

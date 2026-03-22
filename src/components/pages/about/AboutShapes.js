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

const leftShapes = [
  { top: '1%',  ml: 20,  el: <Dot size={7}  opacity={0.4} /> },
  { top: '4%',  ml: 5,   el: <HexOutline size={90}  opacity={0.24} /> },
  { top: '9%',  ml: 70,  el: <Box w="22px" h="22px" clipPath={diamond} bg="rgba(252,129,129,0.2)" /> },
  { top: '12%', ml: 30,  el: <Line length={65} opacity={0.18} /> },
  { top: '15%', ml: 10,  el: <Box w="32px" h="32px" clipPath={tri} bg="rgba(252,129,129,0.14)" /> },
  { top: '18%', ml: 60,  el: <Dot size={5}  opacity={0.3} /> },
  { top: '21%', ml: 15,  el: <HexOutline size={58}  opacity={0.19} /> },
  { top: '25%', ml: 75,  el: <Box w="18px" h="18px" clipPath={triDown} bg="rgba(252,129,129,0.18)" /> },
  { top: '28%', ml: 40,  el: <Line vertical length={50} opacity={0.16} /> },
  { top: '32%', ml: 5,   el: <HexOutline size={100} opacity={0.2} /> },
  { top: '37%', ml: 80,  el: <Dot size={9}  opacity={0.38} /> },
  { top: '40%', ml: 25,  el: <Box w="36px" h="36px" clipPath={diamond} bg="rgba(252,129,129,0.16)" /> },
  { top: '43%', ml: 10,  el: <Line length={72} opacity={0.17} /> },
  { top: '46%', ml: 50,  el: <Box w="26px" h="26px" clipPath={tri} bg="rgba(252,129,129,0.14)" /> },
  { top: '49%', ml: 20,  el: <HexOutline size={68}  opacity={0.21} /> },
  { top: '53%', ml: 78,  el: <Dot size={5}  opacity={0.28} /> },
  { top: '56%', ml: 35,  el: <Line vertical length={44} opacity={0.15} /> },
  { top: '59%', ml: 8,   el: <Box w="44px" h="52px" clipPath={hex} bg="rgba(252,129,129,0.09)" /> },
  { top: '63%', ml: 65,  el: <Box w="20px" h="20px" clipPath={triDown} bg="rgba(252,129,129,0.19)" /> },
  { top: '66%', ml: 15,  el: <HexOutline size={80}  opacity={0.18} /> },
  { top: '70%', ml: 72,  el: <Dot size={7}  opacity={0.35} /> },
  { top: '73%', ml: 20,  el: <Line length={60} opacity={0.16} /> },
  { top: '76%', ml: 5,   el: <Box w="30px" h="30px" clipPath={diamond} bg="rgba(252,129,129,0.17)" /> },
  { top: '79%', ml: 55,  el: <HexOutline size={52}  opacity={0.2} /> },
  { top: '83%', ml: 25,  el: <Box w="24px" h="24px" clipPath={tri} bg="rgba(252,129,129,0.13)" /> },
  { top: '86%', ml: 70,  el: <Dot size={5}  opacity={0.25} /> },
  { top: '89%', ml: 10,  el: <Line length={68} opacity={0.15} /> },
  { top: '92%', ml: 30,  el: <HexOutline size={64}  opacity={0.17} /> },
  { top: '95%', ml: 75,  el: <Box w="16px" h="16px" clipPath={diamond} bg="rgba(252,129,129,0.2)" /> },
  { top: '98%', ml: 40,  el: <Dot size={6}  opacity={0.3} /> },
];

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

const AboutShapes = () => (
  <>
    <ShapeSet side="left" />
    <ShapeSet side="right" />
  </>
);

export default AboutShapes;

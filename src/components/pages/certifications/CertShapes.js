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
  { top: '1%',  ml: 50,  el: <HexOutline size={56}  opacity={0.22} /> },
  { top: '5%',  ml: 15,  el: <Dot size={6}  opacity={0.38} /> },
  { top: '8%',  ml: 70,  el: <Box w="24px" h="24px" clipPath={tri} bg="rgba(252,129,129,0.15)" /> },
  { top: '11%', ml: 10,  el: <Line length={70} opacity={0.18} /> },
  { top: '14%', ml: 30,  el: <HexOutline size={96}  opacity={0.2} /> },
  { top: '19%', ml: 80,  el: <Dot size={8}  opacity={0.42} /> },
  { top: '22%', ml: 20,  el: <Box w="30px" h="30px" clipPath={diamond} bg="rgba(252,129,129,0.18)" /> },
  { top: '25%', ml: 55,  el: <Line vertical length={48} opacity={0.17} /> },
  { top: '29%', ml: 5,   el: <Box w="38px" h="38px" clipPath={triDown} bg="rgba(252,129,129,0.12)" /> },
  { top: '32%', ml: 40,  el: <HexOutline size={70}  opacity={0.21} /> },
  { top: '36%', ml: 75,  el: <Dot size={5}  opacity={0.28} /> },
  { top: '39%', ml: 15,  el: <Line length={60} opacity={0.16} /> },
  { top: '42%', ml: 60,  el: <Box w="22px" h="22px" clipPath={tri} bg="rgba(252,129,129,0.16)" /> },
  { top: '45%', ml: 10,  el: <HexOutline size={88}  opacity={0.19} /> },
  { top: '50%', ml: 70,  el: <Box w="28px" h="28px" clipPath={diamond} bg="rgba(252,129,129,0.2)" /> },
  { top: '53%', ml: 25,  el: <Dot size={7}  opacity={0.35} /> },
  { top: '56%', ml: 45,  el: <Line vertical length={42} opacity={0.15} /> },
  { top: '59%', ml: 8,   el: <Box w="46px" h="54px" clipPath={hex} bg="rgba(252,129,129,0.08)" /> },
  { top: '63%', ml: 68,  el: <Dot size={5}  opacity={0.25} /> },
  { top: '66%', ml: 20,  el: <HexOutline size={62}  opacity={0.2} /> },
  { top: '70%', ml: 80,  el: <Box w="18px" h="18px" clipPath={triDown} bg="rgba(252,129,129,0.18)" /> },
  { top: '73%', ml: 35,  el: <Line length={65} opacity={0.15} /> },
  { top: '76%', ml: 10,  el: <Box w="32px" h="32px" clipPath={tri} bg="rgba(252,129,129,0.14)" /> },
  { top: '79%', ml: 60,  el: <HexOutline size={78}  opacity={0.18} /> },
  { top: '83%', ml: 20,  el: <Dot size={9}  opacity={0.36} /> },
  { top: '86%', ml: 50,  el: <Box w="24px" h="24px" clipPath={diamond} bg="rgba(252,129,129,0.17)" /> },
  { top: '89%', ml: 5,   el: <Line length={72} opacity={0.14} /> },
  { top: '92%', ml: 35,  el: <HexOutline size={54}  opacity={0.21} /> },
  { top: '95%', ml: 75,  el: <Box w="16px" h="16px" clipPath={tri} bg="rgba(252,129,129,0.16)" /> },
  { top: '98%', ml: 45,  el: <Dot size={5}  opacity={0.28} /> },
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

const CertShapes = () => (
  <>
    <ShapeSet side="left" />
    <ShapeSet side="right" />
  </>
);

export default CertShapes;

import { Box } from '@chakra-ui/react';

const hex     = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
const diamond = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
const tri     = 'polygon(50% 0%, 0% 100%, 100% 100%)';
const triDown = 'polygon(0% 0%, 100% 0%, 50% 100%)';

const HexOutline = ({ size, opacity = 0.25, bg = '#0f0f0f' }) => {
  const h = Math.round(size * 1.155);
  return (
    <Box pos="relative" w={`${size}px`} h={`${h}px`}>
      <Box pos="absolute" inset="0" clipPath={hex} bg={`rgba(252,129,129,${opacity})`} />
      <Box pos="absolute" inset="2px" clipPath={hex} bg={bg} />
    </Box>
  );
};

// Each shape: { top, left?, right?, shape, size, opacity, bg? }
const shapes = [
  // ── Hero left-side scattering ────────────────────────────────────
  { top: '6%',  left: '2%',  type: 'hex-outline', size: 70,  opacity: 0.22 },
  { top: '14%', left: '9%',  type: 'dot',         size: 7,   opacity: 0.4  },
  { top: '22%', left: '3%',  type: 'diamond',     size: 28,  opacity: 0.15 },
  { top: '30%', left: '11%', type: 'tri',         size: 22,  opacity: 0.18 },
  { top: '38%', left: '1%',  type: 'hex',         size: 40,  opacity: 0.1  },
  { top: '46%', left: '7%',  type: 'dot',         size: 5,   opacity: 0.3  },
  { top: '52%', left: '13%', type: 'triDown',     size: 20,  opacity: 0.16 },
  { top: '58%', left: '3%',  type: 'hex-outline', size: 50,  opacity: 0.18 },
  { top: '65%', left: '10%', type: 'diamond',     size: 18,  opacity: 0.22 },
  { top: '72%', left: '2%',  type: 'dot',         size: 9,   opacity: 0.35 },
  { top: '79%', left: '8%',  type: 'tri',         size: 26,  opacity: 0.14 },
  { top: '87%', left: '4%',  type: 'hex',         size: 55,  opacity: 0.08 },
  { top: '93%', left: '12%', type: 'dot',         size: 5,   opacity: 0.25 },

  // ── Hero deep-left accent ────────────────────────────────────────
  { top: '18%', left: '18%', type: 'dot',         size: 4,   opacity: 0.2  },
  { top: '43%', left: '20%', type: 'hex-outline', size: 36,  opacity: 0.12 },
  { top: '68%', left: '17%', type: 'diamond',     size: 14,  opacity: 0.2  },

  // ── Right auth-side scattering ───────────────────────────────────
  { top: '8%',  right: '2%', type: 'diamond',     size: 32,  opacity: 0.18 },
  { top: '16%', right: '9%', type: 'dot',         size: 6,   opacity: 0.35 },
  { top: '24%', right: '3%', type: 'hex-outline', size: 60,  opacity: 0.2  },
  { top: '33%', right: '12%',type: 'tri',         size: 24,  opacity: 0.15 },
  { top: '41%', right: '2%', type: 'hex',         size: 38,  opacity: 0.1  },
  { top: '49%', right: '8%', type: 'dot',         size: 8,   opacity: 0.3  },
  { top: '56%', right: '3%', type: 'triDown',     size: 22,  opacity: 0.18 },
  { top: '63%', right: '11%',type: 'hex-outline', size: 44,  opacity: 0.16 },
  { top: '70%', right: '2%', type: 'diamond',     size: 20,  opacity: 0.2  },
  { top: '77%', right: '7%', type: 'dot',         size: 5,   opacity: 0.28 },
  { top: '84%', right: '3%', type: 'hex',         size: 52,  opacity: 0.09 },
  { top: '91%', right: '10%',type: 'tri',         size: 18,  opacity: 0.16 },

  // ── Right deep-accent ────────────────────────────────────────────
  { top: '20%', right: '19%',type: 'dot',         size: 4,   opacity: 0.18 },
  { top: '55%', right: '18%',type: 'diamond',     size: 12,  opacity: 0.2  },
  { top: '75%', right: '20%',type: 'hex-outline', size: 30,  opacity: 0.13 },
];

const Shape = ({ top, left, right, type, size, opacity }) => {
  const pos = { pos: 'absolute', top, zIndex: 0, pointerEvents: 'none' };
  if (left)  pos.left  = left;
  if (right) pos.right = right;

  if (type === 'hex-outline') {
    return (
      <Box {...pos}>
        <HexOutline size={size} opacity={opacity} />
      </Box>
    );
  }

  const clipPath =
    type === 'hex'     ? hex     :
    type === 'diamond' ? diamond :
    type === 'tri'     ? tri     :
    type === 'triDown' ? triDown : undefined;

  if (type === 'dot') {
    return (
      <Box
        {...pos}
        w={`${size}px`}
        h={`${size}px`}
        borderRadius="full"
        bg={`rgba(252,129,129,${opacity})`}
      />
    );
  }

  return (
    <Box
      {...pos}
      w={`${size}px`}
      h={`${size}px`}
      clipPath={clipPath}
      bg={`rgba(252,129,129,${opacity})`}
    />
  );
};

const LandingShapes = () => (
  <>
    {shapes.map((s, i) => (
      <Shape key={i} {...s} />
    ))}
  </>
);

export default LandingShapes;

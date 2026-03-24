import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Spinner, Text, Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useEngagements } from '../../contexts/EngagementContext';

const MotionBox = motion(Box);

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { fetchEngagements } = useEngagements();

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');

    if (!token || !userRaw) {
      navigate('/signin?error=oauth');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      loginWithToken(token, user);
      fetchEngagements().then(() => navigate('/dashboard', { replace: true }));
    } catch {
      navigate('/signin?error=oauth');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Flex
      h="100vh" align="center" justify="center"
      bg="rgba(5,5,7,1)" direction="column" gap={4}
      pos="relative" overflow="hidden"
    >
      {/* Background glow */}
      <MotionBox
        pos="absolute" w="400px" h="400px" borderRadius="full"
        bg="radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        display="flex" flexDirection="column" alignItems="center" gap={4}
      >
        <Flex
          w="52px" h="52px" borderRadius="14px"
          bg="rgba(255,80,95,0.1)" border="1px solid rgba(255,80,95,0.2)"
          align="center" justify="center"
        >
          <Spinner size="md" color="red.400" thickness="2px" />
        </Flex>
        <Text fontSize="14px" fontWeight="semibold" color="white">
          Authenticating…
        </Text>
        <Text fontSize="12px" color="gray.600">
          Signing you in, please wait
        </Text>
      </MotionBox>
    </Flex>
  );
};

export default OAuthCallback;

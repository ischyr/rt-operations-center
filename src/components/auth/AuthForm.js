import { useState } from 'react';
import {
  Stack,
  Card,
  CardBody,
  Heading,
  Text,
  Input,
  Button,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { commonCard } from '../../styles/cardStyles';

const AuthForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authMessage, login, register } = useAuth();

  const isRegister = location.pathname === '/register';

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      if (register(formData.name, formData.email, formData.password)) {
        setFormData({ name: '', email: '', password: '' });
        navigate('/signin');
      }
    } else {
      if (login(formData.email, formData.password)) {
        setFormData({ name: '', email: '', password: '' });
      }
    }
  };

  return (
    <Stack spacing={6} mt={{ base: 8, md: 16 }}>
      <Card sx={{ ...commonCard, minH: '460px', pt: 8, pb: 8 }}>
        <CardBody>
          <Stack spacing={3} align="center">
            <Heading fontSize="3xl">
              {isRegister ? 'Create operator profile' : 'Welcome back'}
            </Heading>
            <Text color="gray.300">
              {isRegister ? 'Register and join the operation.' : 'Sign in to your account.'}
            </Text>
          </Stack>
          <Stack as="form" spacing={3} mt={6} onSubmit={handleSubmit}>
            {isRegister && (
              <Input
                placeholder="Call-sign"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="filled"
                bg="rgba(255,255,255,0.08)"
                _hover={{ bg: 'rgba(255,255,255,0.14)' }}
              />
            )}
            <Input
              placeholder="operator@red-domain.local"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="filled"
              bg="rgba(255,255,255,0.08)"
              _hover={{ bg: 'rgba(255,255,255,0.14)' }}
            />
            <Input
              placeholder="Secure password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              variant="filled"
              bg="rgba(255,255,255,0.08)"
              _hover={{ bg: 'rgba(255,255,255,0.14)' }}
            />
            <Button colorScheme="red" type="submit" size="lg">
              {isRegister ? 'Create Account' : 'Continue'}
            </Button>
          </Stack>
          <Stack spacing={2} mt={3}>
            <Divider />
            <Button variant="outline" colorScheme="gray" size="md">
              Continue with Google
            </Button>
            <Button variant="outline" colorScheme="gray" size="md">
              Continue with X
            </Button>
            <Text textAlign="center" mt={2} color="gray.300">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Button
                variant="link"
                colorScheme="teal"
                onClick={() => navigate(isRegister ? '/signin' : '/register')}
              >
                {isRegister ? 'Sign in' : 'Sign up'}
              </Button>
            </Text>
          </Stack>
          {authMessage && (
            <Alert
              status={authMessage.includes('Access') || authMessage.includes('enrolled') ? 'success' : 'warning'}
              mt={4}
            >
              <AlertIcon />
              {authMessage}
            </Alert>
          )}
        </CardBody>
      </Card>
    </Stack>
  );
};

export default AuthForm;

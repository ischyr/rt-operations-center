import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        background: '#111111',
        color: '#f5f5f5',
        minHeight: '100vh',
        fontFamily: `'Inter', sans-serif`,
      },
    },
  },
});

export default theme;
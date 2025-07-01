import { createTheme, Flex, Loader, MantineColorsTuple, MantineProvider } from '@mantine/core';
import { wsApi } from 'api';
import { appRouter } from 'app/routes';
import { useSubscribe } from 'hooks';
import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';

const tochkaColors: MantineColorsTuple = [
  '#f5ebff',
  '#e4d5fd',
  '#c5a9f3',
  '#a57aeb',
  '#8951e3',
  '#7838df',
  '#6f2ade',
  '#5e1ec6',
  '#5419b2',
  '#47139d'
];
const themeScheme = createTheme({
  colors: {
    tochka: tochkaColors
  },
  primaryColor: 'tochka'
});
export const App = () => {
  const user = useSubscribe(wsApi.user$);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user === null) {
      setLoading(true);
      wsApi.onConnect.then(() => {
        wsApi.refresh((data) => {
          if (!data.user) {
            appRouter.navigate('/login');
          }
          setLoading(false);
        });
      });
    }
  }, [user]);
  if (loading) {
    return (
      <MantineProvider theme={themeScheme}>
        <Flex h={'100vh'} justify={'center'} align={'center'}>
          <Loader/>
        </Flex>
      </MantineProvider>
    );
  }
  return (
    <MantineProvider theme={themeScheme}>
      <RouterProvider router={appRouter}></RouterProvider>
    </MantineProvider>
  );
};

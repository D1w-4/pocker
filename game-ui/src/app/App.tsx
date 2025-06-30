import { createTheme, Flex, Loader, MantineProvider } from '@mantine/core';
import { wsApi } from 'api';
import { appRouter } from 'app/routes';
import { useSubscribe } from 'hooks';
import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';

const theme = createTheme({
  /** Put your mantine theme override here */
});

export const App = () => {
  const user = useSubscribe(wsApi.user$);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user === null) {
      setLoading(true);
      wsApi.onConnect.then(() => {
        console.log('resolve')
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
      <MantineProvider theme={theme}>
        <Flex h={'100vh'} justify={'center'} align={'center'}>
          <Loader/>
        </Flex>
      </MantineProvider>
    );
  }
  return (
    <MantineProvider theme={theme}>
      <RouterProvider router={appRouter}></RouterProvider>
    </MantineProvider>
  );
};

import { Button, Card, Container, Flex, Text, Title } from '@mantine/core';
import { wsApi } from 'api';
import { tables$ } from 'api/sub/tables.sub';
import { useSubscribe } from 'hooks';
import React, { useEffect } from 'react';
import { appRouter } from 'app';

const stateByText = {
  'JOIN': 'Открыто',
  'IN_PROGRESS': 'Идет игра'
};

const stateByColor = {
  'JOIN': 'green',
  'IN_PROGRESS': 'blue'
};

export function TableList(): React.ReactElement {
  const tables = useSubscribe(tables$);

  useEffect(() => {
    tables$.next([]);
    wsApi.getTables();
    const unsub = wsApi.onUpdateTable();
    return () => {
      unsub();
    };
  }, []);
  const joinTable = (tid: string) => () => {
    appRouter.navigate(`/tables/${tid}`);
  };
  const createTable = () => {
    wsApi.createTable((e) => {
      console.log(e)
    });
  };

  if (!tables.length) {
    return (
      <Container>
        <Flex h={'100vh'} justify={'center'} align={'center'}>
          <Button onClick={createTable}>Создать стол</Button>
        </Flex>
      </Container>
    );
  }
  return (
    <Container>
      <Flex mt={'lg'} direction={'column'} align={'start'} gap={15}>
        <Button onClick={createTable}>Создать стол</Button>
        <Flex gap={10} wrap={'wrap'}>
          {tables.map((table) => (
            <Card key={table.id} w={250} shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section mb={'md'} bg={stateByColor[table.state]}>
                <Text c={'white'} ta={'center'} p={'xs'} px={'md'} size={'lg'}>
                  {stateByText[table.state] || table.state}
                </Text>
              </Card.Section>
              <Title mb={'md'}>{table.pin}</Title>
              <Text size={'xs'}>Участники: {table.members}/{table.maxPlayers}</Text>
              <Text size={'xs'}>Закуп: {table.minBuyIn} / {table.maxBuyIn}</Text>
              <Text size={'xs'}>SB:{table.smallBlind}</Text>
              <Text size={'xs'}>BB: {table.bigBlind}</Text>
              <Card.Section mt={'lg'}>
                <Button w={'100%'} onClick={joinTable(table.id)}>Войти</Button>
              </Card.Section>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}

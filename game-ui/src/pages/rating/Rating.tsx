import { Container } from '@mantine/core';
import { TopUsers } from 'components';
import React from 'react';

export function Rating(): React.ReactElement {
  return (
    <Container pt={'lg'}>
      <TopUsers/>
    </Container>
  );
}

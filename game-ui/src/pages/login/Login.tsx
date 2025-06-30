import { Button, Card, Container, Flex, PasswordInput, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { wsApi } from 'api';
import { appRouter } from 'app';
import React from 'react';

export function LoginPage() {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      login: '',
      password: ''
    }
  });

  const onLogin = () => {
    const data = form.getValues();
    wsApi.auth(data.login, data.password, (data) => {
      if (data.code !== 200) {
        form.setFieldError('password', data.error);
      }
      appRouter.navigate('/tables');
    });
  };

  return (
    <Container>
      <Flex h={'100vh'} direction={'column'} justify={'center'} align={'center'}>
        <Card w={400}>
          <Flex gap={'sm'} direction={'column'}>
            <TextInput {...form.getInputProps('login')} label={'Логин'}/>
            <PasswordInput label={'Пароль'} {...form.getInputProps('password')}/>
            <Button onClick={onLogin}>Войти</Button>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}

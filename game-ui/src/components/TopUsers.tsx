import { Table, Text } from '@mantine/core';
import { wsApi } from 'api';
import { UserProfile } from 'api/models/User.model';
import React, { useEffect, useState } from 'react';

export function TopUsers(): React.ReactElement {
  const [userList, setUserList] = useState<Array<UserProfile>>([]);
  const updateUsers = () => {
    wsApi.getUsers((nextUserList) => {
      nextUserList.sort((a, b) => {
        return a.chips > b.chips ? -1 : 1;
      });
      setUserList(
        nextUserList
      );
    });
  };
  useEffect(() => {
    const time = setInterval(() => {
      updateUsers();
    }, 1000);
    return () => {
      clearTimeout(time);
    };
  }, []);

  return (

    <Table striped>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>№</Table.Th>
          <Table.Th>Имя</Table.Th>
          <Table.Th>$</Table.Th>
          <Table.Th>Побед</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {userList.map((user, i) => {
          return (
            <Table.Tr key={i}>
              <Table.Td w={20}>
                <Text>{i + 1}</Text>
              </Table.Td>
              <Table.Td>
                <Text>{user.username}</Text>
              </Table.Td>
              <Table.Td>
                <Text>${user.chips}</Text>
              </Table.Td>
              <Table.Td>
                <Text>{user.wins}</Text>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

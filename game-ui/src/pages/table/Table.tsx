import { wsApi } from 'api';
import { GameState, IAction, IGameWinner, Player } from 'api/models/GameTable';
import { TopUsers } from './../../components';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Text, Avatar, Badge, Box, Flex, Group, Title, Table as MTable, Button, Modal, Select } from '@mantine/core';
import { getBestCards } from './bestCards';
import { rankHandInt } from './rankHand';

function GameCard(props: { card: string }) {
  const [src, setSrc] = useState('');
  const { card } = props;

  useEffect(() => {
    var str = '';
    switch (card[0]) {
      case 'J':
        str += 'jack';
        break;
      case 'Q':
        str += 'queen';
        break;
      case 'K':
        str += 'king';
        break;
      case 'A':
        str += 'ace';
        break;
      case 'T':
        str += '10';
        break;
      default :
        str += card[0];
        break;
    }
    str += '_of_';
    switch (card[1]) {
      case 'D':
        str += 'diamonds';
        break;
      case 'S':
        str += 'spades';
        break;
      case 'C':
        str += 'clubs';
        break;
      case 'H':
        str += 'hearts';
        break;
    }
    str += '.png';
    setSrc(str);
  }, [card]);
  return (
    <img style={{ width: '100%' }} src={`/cards/${src}`} alt=""/>
  );
}

export function Table(): React.ReactElement {
  const [tableData, setTableData] = useState<GameState | null>();
  const { id } = useParams();
  useEffect(() => {
    if (!id) {
      return;
    }
    wsApi.getTable(id, setTableData);
    const unsub = wsApi.onBroadcastTable(id, (data) => {
      setTableData(data);
    });
    return () => {
      unsub();
    };
  }, [id]);

  if (!tableData) {
    return <></>;
  }

  return (
    <PokerTable state={tableData}/>
  );
}

type TRole = 'SB' | 'BB' | '';
type PlayerProps = {
  player: Player;
  bet: number | null;
  role?: TRole;
  index: number;
};

const playerPos = [
  {
    pos: {
      left: 100,
      top: -70
    },
    direction: 'top'
  },
  {
    pos: {
      left: 270,
      top: -70
    },
    direction: 'top'
  },
  {
    pos: {
      left: 440,
      top: -70
    },
    direction: 'top'
  },
  {
    pos: {
      left: 610,
      top: -70
    },
    direction: 'top'
  },
  {
    pos: {
      left: 100,
      bottom: -70
    },
    direction: 'bottom'
  },
  {
    pos: {
      left: 270,
      bottom: -70
    },
    direction: 'bottom'
  },
  {
    pos: {
      left: 440,
      bottom: -70
    },
    direction: 'bottom'
  },
  {
    pos: {
      left: 610,
      bottom: -70
    },
    direction: 'bottom'
  },
  {
    pos: {
      left: 0,
      top: 150
    },
    direction: 'left'
  },
  {
    pos: {
      right: 0,
      top: 150
    },
    direction: 'right'
  }
];

const PlayerRotate = {
  top: 0,
  bottom: 180,
  left: -90,
  right: 90
};
const contentRotate = {
  top: 0,
  bottom: -180,
  left: 0,
  right: -180
};
const playerNameTranslate = {
  top: 65,
  bottom: -65,
  left: 75,
  right: 75
};

type PlayerNameProps = {
  player: Player;
  index: number;
  isActive: boolean
};

function PlayerName({ player, isActive, index }: PlayerNameProps) {
  const { allIn, playerName, chips } = player;
  const direction = playerPos[index].direction;
  let styleByState = {
    border: '4px solid #731313',
    background: 'brown'
  };
  if (isActive) {
    styleByState = {
      border: '4px solid black',
      background: 'green'
    };
  }
  return (
    <div style={{
      position: 'absolute',
      ...playerPos[index].pos,
      transform: `rotate(${PlayerRotate[direction]}deg)`,
      width: 150,
      zIndex: 0
    }}>
      <Text style={{
        transform: `rotate(${contentRotate[direction]}deg)`
      }} fw={700} ta={'center'} size={'xl'} c={'black'}>
        {playerName}
      </Text>
      <Box style={{
        ...styleByState,
        borderRadius: 10,
        height: 300
      }}>
        <Text style={{
          transform: `rotate(${contentRotate[direction]}deg)`
        }} ta={'center'} fw={700} size="xl" c={'white'}>
          {allIn ? 'ALL IN' : (<>${chips}</>)}
        </Text>
      </Box>
    </div>
  );
}

function Player({ index, player, bet = 0, role }: PlayerProps) {
  const { cards } = player;
  const folded = false;
  const blindColor = role === 'SB' ? 'grape' : 'yellow';
  const direction = playerPos[index].direction;

  return (
    <Box
      w={150}
      p="xs"
      style={{
        zIndex: 2,
        borderRadius: 6,
        color: folded ? '#888' : 'white',
        fontFamily: 'monospace',
        fontSize: 12,
        textAlign: 'center',
        position: 'absolute',
        transform: `translateY(${playerNameTranslate[direction]}px) rotate(${PlayerRotate[direction]}deg)`,
        ...playerPos[index].pos
      }}
    >
      <Flex mt={20} gap={10} direction={'column'}>
        {!folded && (
          <Box>
            <Flex gap={5}>
              {cards.map((card, i) => {
                return <div key={i} style={{ width: '50%' }}><GameCard card={card}/></div>;
              })}
            </Flex>
            <Text style={{
              transform: `rotate(${contentRotate[direction]}deg)`
            }} fw={700} size="xl">${bet}</Text>
          </Box>
        )}
        {folded && (<Badge style={{
          transform: `rotate(${contentRotate[direction]}deg)`
        }} size="xl" color={'red'}>folded</Badge>)}
        <Flex align={'center'} justify={'center'}>
          <Avatar.Group>
            {role && <Avatar style={{
              transform: `rotate(${contentRotate[direction]}deg)`
            }} color={blindColor} fw={700} variant="filled">{role}</Avatar>}
          </Avatar.Group>
        </Flex>
      </Flex>
    </Box>
  );
}

interface IActionsProps {
  actions: IAction[];
}

function Actions(props: IActionsProps): React.ReactElement {
  return (
    <MTable striped>
      <MTable.Tbody>
        {props.actions.map((s, i) => {
          return {
            ...s,
            index: i
          };
        }).reverse().map((action, i) => {
          return (
            <MTable.Tr key={action.index} bg={i === 0 ? 'green' : 'transparent'}>
              <MTable.Td>
                <Text>{action.playerName}</Text>
              </MTable.Td>
              <MTable.Td>
                <Text>{action.action} {'amount' in action ? `$${action.amount}` : ''}</Text>
              </MTable.Td>
            </MTable.Tr>
          );
        })}
      </MTable.Tbody>
    </MTable>
  );
}

function BoardCards(props: { cards: Array<string> }): React.ReactElement {
  const cardSlot = new Array(5).fill(void 0);
  return (
    <div style={{
      position: 'absolute',
      zIndex: 2,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }}>
      <Group gap={5}>
        {cardSlot.map((_, i) => {
          const card = props.cards[i];
          return (
            <div
              key={i}
              style={{
                width: 70,
                height: 90,
                borderRadius: 5,
                border: '4px solid white'
              }}>
              {card && (
                <GameCard card={card}/>
              )}
            </div>
          );
        })}
      </Group>
    </div>
  );
}

interface PokerTableProps {
  state: GameState;
}

export function GameResult(props: { tid: string }) {
  const [results, setResults] = useState<Array<GameState>>([]);
  const [gameNumber, setGameNumber] = useState<string | null>(null);
  useEffect(() => {
    wsApi.tableStats(props.tid, (results) => {
      setResults(results);
      setGameNumber((results.length - 1).toString());
    });
  }, [props.tid]);
  const game = results[gameNumber || results.length - 1];
  if (!game) {
    return <></>;
  }
  const wIds = game.gameWinners.map((player) => player.id);
  game.players.sort((a, b) => {
    return wIds.includes(a.id) ? -1 : 1;
  });
  return (
    <div>
      <Select
        mb={'lg'}
        onChange={(value) => {
          setGameNumber(value);
        }}
        value={gameNumber} data={results.map((_, i) => i.toString())}
      />
      <MTable striped>
        <MTable.Tbody>
          {game.players.map((player, i) => {
            const isWin = wIds.includes(player.id);
            const cards = [...player.cards, ...game.board];
            const bestHand = getBestCards(cards);
            const rank = rankHandInt({ cards });
            return (
              <MTable.Tr key={i} bg={isWin ? 'green' : 'transparent'}>
                <MTable.Td valign={'top'}>
                  <Text size={'lg'} fw={'bold'}>{player.playerName}</Text>
                  <Flex direction={'column'} gap={5}>
                    <Badge size="lg">${player.chips}</Badge>
                    <Badge size="lg">{rank.rank}</Badge>
                    {player.allIn && <Badge color={'red'}>ALL IN</Badge>}
                    {player.folded && <Badge color={'red'}>folded</Badge>}
                  </Flex>
                </MTable.Td>
                <MTable.Td valign={'top'}>
                  <Text mb={10} fw={'bold'} size={'lg'}>{rank.message}</Text>
                  <Flex gap={5}>
                    {cards.map((item) => {
                      const isComb = bestHand.combination.includes(item);
                      const isKicker = bestHand.kicker === item;
                      let order = 3;
                      if (isComb) {order = 0;}
                      if (isKicker) {order = 1;}
                      return {
                        card: item,
                        order
                      };
                    }).sort((a, b) => {
                      return a.order > b.order ? 1 : -1;
                    }).sort((a, b) => {
                      const indexA = bestHand.combination.indexOf(a.card);
                      const indexB = bestHand.combination.indexOf(b.card);
                      if (indexA === -1 && indexB === -1) {
                        return 0;
                      }
                      return indexA > indexB ? -1 : 1;
                    }).map(({ card }) => {
                      const isComb = bestHand.combination.includes(card);
                      const isKicker = bestHand.kicker === card;
                      console.log(card);
                      if (isKicker) {
                        return (<div style={{
                          width: 100,
                          opacity: 1,
                          transform: 'translateY(-40px)'
                        }}>
                          <Text fw={'bold'} size={'lg'}>Kicker</Text>
                          <GameCard card={card}/>
                        </div>);
                      }
                      return (
                        <div style={{
                          width: 100,
                          transform: isComb ? 'translateY(-10px)' : 'translateY(5px)',
                          opacity: isComb ? 1 : '0.3'
                        }}>
                          <GameCard card={card}/>
                        </div>
                      );
                    })}
                  </Flex>
                </MTable.Td>
              </MTable.Tr>
            );
          })}
        </MTable.Tbody>
      </MTable>
    </div>
  );
}

export function PokerTable(props: PokerTableProps) {
  const { tid, actions, pin, board, gameWinners, state, game, players, currentPlayer, playersToAdd } = props.state;
  const resultPlayer = state === 'JOIN' ? playersToAdd : players;
  const [showResult, setShowResult] = React.useState(false);

  useEffect(() => {
    if (gameWinners.length) {
      setShowResult(true);
    }
  }, [gameWinners]);
  return (
    <>
      <Modal title={<Title>Результаты</Title>} fullScreen opened={showResult} onClose={() => setShowResult(false)}>
        {showResult && (<GameResult tid={tid}/>)}
      </Modal>
      <Flex h={'100vh'} justify={'space-between'}>
        <div style={{ alignSelf: 'start' }}>
          <TopUsers/>
        </div>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
          <Flex direction={'column'} align={'center'} justify={'center'}>
            <Title mb={'lg'} fs={'300px'} ta={'center'} fw={'bold'}>PIN: {pin}</Title>
            <Button.Group>
              <Button
                disabled={state !== 'JOIN'}
                onClick={() => {
                  wsApi.startGame(tid);
                }}>Старт</Button>
              <Button
                disabled={state !== 'JOIN' || !gameWinners.length}
                onClick={() => {
                  setShowResult(true);
                }}>Результаты</Button>
            </Button.Group>
          </Flex>
          <div style={{
            width: '900px',
            height: '600px',
            position: 'relative',
            margin: 100
          }}>
            {resultPlayer.map((player, i) => {
              let role: TRole = '';
              if ('blinds' in game) {
                const index = game.blinds.indexOf(i);
                if (index === 0) {
                  role = 'SB';
                } else if (index === 1) {
                  role = 'BB';
                }
              }
              let bet: number = 0;
              if ('bets' in game) {
                bet = game.bets[i];
              }
              return (
                <React.Fragment key={player.id}>
                  <PlayerName isActive={currentPlayer === i} index={i} player={player}/>
                  <Player
                    bet={bet}
                    index={i}
                    role={role}
                    player={player}
                  />
                </React.Fragment>
              );
            })}

            <BoardCards cards={board}/>

            <Box
              bg="green"
              pos="absolute"
              style={{
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                borderRadius: '150px / 100px', // вытянутое по горизонтали
                border: '4px solid #222',
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
            </Box>
          </div>
        </div>
        <div>
          <Actions actions={actions}/>
        </div>
      </Flex>
    </>
  );
}

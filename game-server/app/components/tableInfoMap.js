module.exports = (table, uuid) => {
  return {
    /**
     * Состояние игры
     * JOIN - ожидается подключение игроков к игре метод (join-table)
     * IN_PROGRESS - игра в процессе
     */
    state: table.state,
    /**
     * ID таблицы
     */
    id: table.tid,
    /**
     * Короткий пин чтобы удобно присоеденятся к нужно таблице
     * Все основные методы работают через pin
     */
    pin: table.pin,

    /**
     * Размер small blind
     */
    smallBlind: table.smallBlind,

    /**
     * Размер big blind
     */
    bigBlind: table.bigBlind,

    /**
     * Минимум сумма с которой можно присоединится к столу
     */
    minBuyIn: table.minBuyIn,
    /**
     * Максимальная сумма с которой можно присоединится к столу
     */
    maxBuyIn: table.maxBuyIn,
    /**
     * Карты на игральном столе
     */
    board: table?.game.board || [],
    /**
     * Карты игрока
     */
    cards: table?.players?.find(player => player.id === uuid)?.cards || [],
    /**
     * Твоя очередь хода
     */
    yourMove: table?.players?.findIndex(player => player.id === uuid) === table.currentPlayer,
    players: table.players?.map(player => {
      return {
        /**
         * ID игрока
         */
        id: player.id,
        /**
         * Ник игрока
         */
        playerName: player.playerName,
        /**
         * Денег у игрока
         */
        chips: player.chips,
        /**
         * Игрок сбросил карты
         */
        folded: player.folded,
        /**
         * Игрок играет в all in
         */
        allIn: player.allIn,
      }
    }),
    /**
     * Количество денег в банке
     */
    bankAmount: table.actions.reduce((acc, action) => {
      return acc + (action.amount || 0)
    }, 0),
    /**
     * Действия игроков
     */
    actions: table.actions
  }
}

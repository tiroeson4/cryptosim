// REST endpoints of topic 8 (see api/routes.json) and the db.json collections behind them.
export const endpoints = {
  markets: "/topic8/markets",
  pairs: "/topic8/pairs",
  orders: "/topic8/orders",
  trades: "/topic8/trades",
  balances: "/topic8/balances",
};

export const collections = {
  [endpoints.markets]: "t8_markets",
  [endpoints.pairs]: "t8_pairs",
  [endpoints.orders]: "t8_orders",
  [endpoints.trades]: "t8_trades",
  [endpoints.balances]: "t8_balances",
};

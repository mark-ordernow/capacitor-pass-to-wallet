import { registerPlugin } from '@capacitor/core';

import type { PassToWalletPlugin } from './definitions';

const PassToWallet = registerPlugin<PassToWalletPlugin>('PassToWallet', {
  web: () => import('./web').then((m) => new m.PassToWalletWeb()),
});

export * from './definitions';
export { PassToWallet };

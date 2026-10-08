import { registerPlugin } from '@capacitor/core';

import type { PassToWalletPlugin } from './definitions.js';

export const PassToWallet = registerPlugin<PassToWalletPlugin>('PassToWallet', {
  web: () => import('./web.js').then((m) => new m.PassToWalletWeb()),
});

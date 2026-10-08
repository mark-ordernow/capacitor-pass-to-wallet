import { WebPlugin } from '@capacitor/core';

import type { PassToWalletPlugin } from './definitions';

export class PassToWalletWeb extends WebPlugin implements PassToWalletPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}

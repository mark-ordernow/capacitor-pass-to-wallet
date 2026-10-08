import { WebPlugin } from '@capacitor/core';

/**
 * No Wallet on the web: availability checks say no. Every other method is
 * missing here, so Capacitor rejects it as "not implemented on web".
 */
export class PassToWalletWeb extends WebPlugin {
  async canAddPasses(): Promise<{ canAdd: boolean }> {
    return { canAdd: false };
  }

  async isAvailable(): Promise<{ available: boolean }> {
    return { available: false };
  }
}

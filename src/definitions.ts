import type { PluginListenerHandle } from '@capacitor/core';

/** Identifies a pass already in Apple Wallet. */
export interface ApplePassRef {
  passTypeIdentifier: string;
  serialNumber: string;
}

export interface AddButtonSize {
  width: number;
  height: number;
}

/** CSS px from `getBoundingClientRect()` (= points relative to the web view). */
export interface AddButtonFrame extends AddButtonSize {
  x: number;
  y: number;
}

export interface PassToWalletPlugin {
  // ---- iOS: Apple Wallet (PassKit) ----

  /** iOS only. `PKAddPassesViewController.canAddPasses()`. */
  canAddPasses(): Promise<{ canAdd: boolean }>;

  /** iOS only. Whether the pass is in this device's Wallet. */
  passExists(ref: ApplePassRef): Promise<{ exists: boolean }>;

  /** iOS only. Opens the pass in Wallet; rejects when it is not on the device. */
  openPass(ref: ApplePassRef): Promise<void>;

  /**
   * iOS only. Shows the system add sheet for a signed `.pkpass` (base64).
   * Resolves once the sheet is dismissed, added or cancelled: call
   * `passExists` to know which.
   */
  addPass(options: { base64: string }): Promise<void>;

  /** iOS only. Intrinsic size of `PKAddPassButton`, for the web placeholder. */
  addButtonSize(): Promise<AddButtonSize>;

  /**
   * iOS only. Draws the official `PKAddPassButton` at its system size,
   * centered on `frame`; taps arrive as `addButtonTap` events.
   */
  showAddButton(frame: AddButtonFrame): Promise<void>;

  /** iOS only. Hides the native add button. */
  hideAddButton(): Promise<void>;

  /** iOS only. The native add button was tapped. */
  addListener(eventName: 'addButtonTap', listenerFunc: () => void): Promise<PluginListenerHandle>;

  // ---- Android: Google Wallet (Google Pay API) ----

  /**
   * Android only. `PayClient.getPayApiAvailabilityStatus(SAVE_PASSES)`;
   * `false` also when the check itself fails.
   */
  isAvailable(): Promise<{ available: boolean }>;

  /**
   * Android only. `PayClient.savePassesJwt` with a signed save JWT.
   * Resolves when the save screen returns (saved or cancelled); rejects with
   * code `SAVE_ERROR` on `SavePassesResult.SAVE_ERROR`.
   */
  savePassesJwt(options: { jwt: string }): Promise<void>;
}

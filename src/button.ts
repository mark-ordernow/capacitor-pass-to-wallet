import { Capacitor } from '@capacitor/core';

import type { AddButtonLayout, AddButtonSize } from './definitions.js';
import { GOOGLE_BADGES } from './generated/google-badges.js';
import { PassToWallet } from './plugin.js';

export type PassToWalletButtonMode = 'add' | 'view';
export type PassToWalletButtonVariant = 'button' | 'badge';

const STYLE = `<style>
  :host { display: inline-block; line-height: 0; }
  :host([hidden]) { display: none; }
  button { all: unset; cursor: pointer; display: block; }
  button:focus-visible { outline: 2px solid; outline-offset: 2px; }
  img { display: block; height: var(--pass-to-wallet-height, 48px); }
  .apple-add { display: block; }
  /* Apple has no official "view" control; the HIG suggests a link labelled
     like "View in Wallet". Restyle with ::part(button) or the variables. */
  .apple-view {
    height: var(--pass-to-wallet-height, 48px);
    color: var(--pass-to-wallet-color, #007aff);
    /* Inherits the surrounding font unless --pass-to-wallet-font is set. */
    font: var(--pass-to-wallet-font, inherit);
    line-height: var(--pass-to-wallet-height, 48px);
  }
</style>`;

/** Lowercase BCP 47 key Google ships for the device language, else English. */
export function googleBadgeKey(keys: readonly string[], languages: readonly string[]): string {
  for (const tag of languages) {
    const [lang, ...rest] = tag.toLowerCase().replace(/_/g, '-').split('-');
    // zh-Hant-TW → zh-tw: skip the script subtag.
    const region = rest.find((part) => /^([a-z]{2}|\d{3})$/.test(part));
    const key = [region && `${lang}-${region}`, lang].find((k) => k && keys.includes(k));
    if (key) return key;
  }
  return 'en';
}

// There is one native PKAddPassButton: the element that last placed it gets its taps.
let appleOwner: PassToWalletButton | null = null;
let appleTapListening = false;
const appleSizes: Partial<Record<AddButtonLayout, Promise<AddButtonSize>>> = {};

// Lets the module load where HTMLElement does not exist (SSR, unit tests).
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

/**
 * `<pass-to-wallet-button mode="add|view" variant="button|badge" layout="one-line|two-line">`
 *
 * iOS: the official PKAddPassButton drawn natively over this element (Apple
 * requires it in apps); `mode="view"` renders a link-style button with the
 * slotted content (default "View in Wallet"), restylable via ::part(button).
 * Android: Google's official artwork in the page language (nearest `lang`),
 * else the device language; `variant` picks the button or the badge.
 * Web: renders nothing.
 * Taps fire a `walletclick` event; issuing and saving the pass stays with the app.
 */
export class PassToWalletButton extends Base {
  static observedAttributes = ['mode', 'variant', 'layout'];

  private readonly root = this.attachShadow({ mode: 'open' });
  private renderId = 0;
  private frame: number | null = null;
  private shownFrame = '';

  get mode(): PassToWalletButtonMode {
    return this.getAttribute('mode') === 'view' ? 'view' : 'add';
  }

  get variant(): PassToWalletButtonVariant {
    return this.getAttribute('variant') === 'badge' ? 'badge' : 'button';
  }

  /** iOS add button only. */
  get layout(): AddButtonLayout {
    return this.getAttribute('layout') === 'two-line' ? 'two-line' : 'one-line';
  }

  connectedCallback(): void {
    void this.render();
  }

  disconnectedCallback(): void {
    this.renderId++;
    this.stopTracking();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) void this.render();
  }

  /**
   * The page's language first (nearest `lang`, as HTML defines it: apps with
   * their own language setting set it on <html>), then the device's.
   */
  private languages(): string[] {
    const lang = this.closest('[lang]')?.getAttribute('lang');
    return [...(lang ? [lang] : []), ...(navigator.languages ?? [navigator.language])];
  }

  private readonly emit = (): void => {
    this.dispatchEvent(new CustomEvent('walletclick', { bubbles: true, composed: true }));
  };

  private async render(): Promise<void> {
    const id = ++this.renderId;
    this.stopTracking();
    const platform = Capacitor.getPlatform();
    if (platform === 'ios' && this.mode === 'add') {
      const layout = this.layout;
      const size = await (appleSizes[layout] ??= PassToWallet.addButtonSize({ layout })).catch(() => null);
      if (id !== this.renderId) return;
      if (!size) {
        this.root.innerHTML = '';
        return;
      }
      // iOS's own localized size unless the app sets one (a height alone keeps
      // iOS's ratio); the native button itself is what VoiceOver and taps reach.
      this.root.innerHTML = `${STYLE}<div part="button" class="apple-add"
        style="height: var(--pass-to-wallet-height, ${size.height}px);
          width: var(--pass-to-wallet-width, calc(var(--pass-to-wallet-height, ${size.height}px) * ${size.width / size.height}))"></div>`;
      if (!appleTapListening) {
        appleTapListening = true;
        void PassToWallet.addListener('addButtonTap', () => appleOwner?.emit());
      }
      this.startTracking();
    } else if (platform === 'ios') {
      this.root.innerHTML = `${STYLE}<button part="button" class="apple-view"><slot>View in Wallet</slot></button>`;
    } else if (platform === 'android') {
      const badges = GOOGLE_BADGES[this.mode];
      const svg = (await badges[googleBadgeKey(Object.keys(badges), this.languages())]())[this.variant];
      if (id !== this.renderId) return;
      // encodeURIComponent leaves no quotes, so the data URL is safe in the attribute.
      this.root.innerHTML = `${STYLE}<button part="button"><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svg,
      )}" alt="${this.mode === 'add' ? 'Add to Google Wallet' : 'View in Google Wallet'}"></button>`;
    } else {
      this.root.innerHTML = '';
    }
    this.root.querySelector('button')?.addEventListener('click', this.emit);
  }

  /**
   * The native button sits over the web view, so it must follow this element.
   * Sampling every frame covers scroll, modals and page transitions; the
   * bridge is only called when the frame or visibility changes.
   */
  private startTracking(): void {
    const tick = (): void => {
      this.syncAppleButton();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private stopTracking(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.releaseAppleButton();
  }

  private releaseAppleButton(): void {
    this.shownFrame = '';
    if (appleOwner !== this) return;
    appleOwner = null;
    PassToWallet.hideAddButton().catch(() => undefined);
  }

  private syncAppleButton(): void {
    const rect = this.root.querySelector('.apple-add')?.getBoundingClientRect();
    // The native button ignores web clipping: show it only when every corner
    // is visible (not under a header, footer, modal or off-screen).
    const root = this.getRootNode() as Document | ShadowRoot;
    const visible =
      !!rect?.width &&
      [
        [rect.left + 1, rect.top + 1],
        [rect.right - 1, rect.top + 1],
        [rect.left + 1, rect.bottom - 1],
        [rect.right - 1, rect.bottom - 1],
      ].every(([x, y]) => {
        const hit = root.elementFromPoint(x, y);
        return hit === this || this.contains(hit);
      });
    if (!rect || !visible) {
      this.releaseAppleButton();
      return;
    }
    const frame = `${rect.left},${rect.top},${rect.width},${rect.height}`;
    if (appleOwner === this && frame === this.shownFrame) return;
    appleOwner = this;
    this.shownFrame = frame;
    PassToWallet.showAddButton({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      layout: this.layout,
    }).catch(() => undefined);
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('pass-to-wallet-button')) {
  customElements.define('pass-to-wallet-button', PassToWalletButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'pass-to-wallet-button': PassToWalletButton;
  }
}

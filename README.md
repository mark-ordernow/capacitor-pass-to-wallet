# @minhvdv/capacitor-pass-to-wallet

Add passes to Apple Wallet (PassKit) and Google Wallet (Google Pay API) from Capacitor apps

## Compatibility

| Capacitor | iOS | Android |
| --- | --- | --- |
| 6.x | 13+ | Java 17+ |
| 7.x | 14+ | Java 17+ |
| 8.x | 15+ | Java 17+ |

One source for all three (`peerDependencies: @capacitor/core >=6 <9`). Built and checked against 6.2.2, 7.6.9 and 8.5.3 on both platforms.

## Install

```bash
npm install @minhvdv/capacitor-pass-to-wallet
npx cap sync
```


### iOS

- Add the Wallet capability: `com.apple.developer.pass-type-identifiers` with your Pass Type ID.
- `PKAddPassButton` and the add sheet follow the app language only for languages listed in `CFBundleLocalizations` (Info.plist).

### Android

Nothing to configure: `com.google.android.gms:play-services-pay` comes with the plugin (override with `playServicesPayVersion` in `variables.gradle`).

## Wallet button

```ts
import '@minhvdv/capacitor-pass-to-wallet'; // registers <pass-to-wallet-button>
```

```html
<pass-to-wallet-button mode="add" variant="button"></pass-to-wallet-button>
<pass-to-wallet-button mode="view">Open in Apple Wallet</pass-to-wallet-button>
```

| Attribute | Values | Default |
| --- | --- | --- |
| `mode` | `add` · `view` (already added) | `add` |
| `variant` | `button` · `badge` (Google artwork style) | `button` |

- **iOS**: `mode="add"` is the official `PKAddPassButton`, drawn natively over the element and kept in place while the page scrolls or animates (hidden when anything covers it). `mode="view"` is yours to design (see below): Apple has no official control and only suggests a link labelled like "View in Wallet".
- **Android**: Google's official "Add to / View in Google Wallet" artwork in the page language: the nearest `lang` attribute (on the element or `<html>`, so apps with their own language setting just keep `<html lang>` current), then the device language (`navigator.languages`), then English. Only the chosen language is downloaded.
- iOS draws `PKAddPassButton` in the app's iOS language (device or per-app language in iOS Settings, limited to `CFBundleLocalizations`); Apple offers no way to set it from the web page.
- **Web**: renders nothing.
- Height: CSS `--pass-to-wallet-height` (default `48px`); width follows the artwork.

### Customizing the Apple "view" button

Official artwork (`PKAddPassButton`, Google's badges) must not be altered, so only the iOS `mode="view"` button is customizable. By default it is a link-style "View in Wallet" in the surrounding font (inherited from the parent).

```html
<!-- Content: any HTML, e.g. your translated label and an icon -->
<pass-to-wallet-button mode="view">
  <img src="wallet.svg" alt="" /> Xem trong Wallet
</pass-to-wallet-button>
```

```css
/* Quick tweaks */
pass-to-wallet-button {
  --pass-to-wallet-color: #000;
  --pass-to-wallet-font: 600 15px system-ui;
}

/* Full control */
pass-to-wallet-button::part(button) {
  background: #000;
  color: #fff;
  border-radius: 12px;
  padding: 0 20px;
}
```
- Taps fire `walletclick`. Issuing the pass and calling `addPass` / `savePassesJwt` stays with the app.

Angular: add `CUSTOM_ELEMENTS_SCHEMA` to the component, then `(walletclick)="add()"`.

## API

<docgen-index>

* [`canAddPasses()`](#canaddpasses)
* [`passExists(...)`](#passexists)
* [`openPass(...)`](#openpass)
* [`addPass(...)`](#addpass)
* [`addButtonSize()`](#addbuttonsize)
* [`showAddButton(...)`](#showaddbutton)
* [`hideAddButton()`](#hideaddbutton)
* [`addListener('addButtonTap', ...)`](#addlisteneraddbuttontap-)
* [`isAvailable()`](#isavailable)
* [`savePassesJwt(...)`](#savepassesjwt)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### canAddPasses()

```typescript
canAddPasses() => Promise<{ canAdd: boolean; }>
```

iOS only. `PKAddPassesViewController.canAddPasses()`.

**Returns:** <code>Promise&lt;{ canAdd: boolean; }&gt;</code>

--------------------


### passExists(...)

```typescript
passExists(ref: ApplePassRef) => Promise<{ exists: boolean; }>
```

iOS only. Whether the pass is in this device's Wallet.

| Param     | Type                                                  |
| --------- | ----------------------------------------------------- |
| **`ref`** | <code><a href="#applepassref">ApplePassRef</a></code> |

**Returns:** <code>Promise&lt;{ exists: boolean; }&gt;</code>

--------------------


### openPass(...)

```typescript
openPass(ref: ApplePassRef) => Promise<void>
```

iOS only. Opens the pass in Wallet; rejects when it is not on the device.

| Param     | Type                                                  |
| --------- | ----------------------------------------------------- |
| **`ref`** | <code><a href="#applepassref">ApplePassRef</a></code> |

--------------------


### addPass(...)

```typescript
addPass(options: { base64: string; }) => Promise<void>
```

iOS only. Shows the system add sheet for a signed `.pkpass` (base64).
Resolves once the sheet is dismissed, added or cancelled: call
`passExists` to know which.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ base64: string; }</code> |

--------------------


### addButtonSize()

```typescript
addButtonSize() => Promise<AddButtonSize>
```

iOS only. Intrinsic size of `PKAddPassButton`, for the web placeholder.

**Returns:** <code>Promise&lt;<a href="#addbuttonsize">AddButtonSize</a>&gt;</code>

--------------------


### showAddButton(...)

```typescript
showAddButton(frame: AddButtonFrame) => Promise<void>
```

iOS only. Draws the official `PKAddPassButton` over the web view at
`frame`; taps arrive as `addButtonTap` events.

| Param       | Type                                                      |
| ----------- | --------------------------------------------------------- |
| **`frame`** | <code><a href="#addbuttonframe">AddButtonFrame</a></code> |

--------------------


### hideAddButton()

```typescript
hideAddButton() => Promise<void>
```

iOS only. Hides the native add button.

--------------------


### addListener('addButtonTap', ...)

```typescript
addListener(eventName: 'addButtonTap', listenerFunc: () => void) => Promise<PluginListenerHandle>
```

iOS only. The native add button was tapped.

| Param              | Type                        |
| ------------------ | --------------------------- |
| **`eventName`**    | <code>'addButtonTap'</code> |
| **`listenerFunc`** | <code>() =&gt; void</code>  |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

--------------------


### isAvailable()

```typescript
isAvailable() => Promise<{ available: boolean; }>
```

Android only. `PayClient.getPayApiAvailabilityStatus(SAVE_PASSES)`;
`false` also when the check itself fails.

**Returns:** <code>Promise&lt;{ available: boolean; }&gt;</code>

--------------------


### savePassesJwt(...)

```typescript
savePassesJwt(options: { jwt: string; }) => Promise<void>
```

Android only. `PayClient.savePassesJwt` with a signed save JWT.
Resolves when the save screen returns (saved or cancelled); rejects with
code `SAVE_ERROR` on `SavePassesResult.SAVE_ERROR`.

| Param         | Type                          |
| ------------- | ----------------------------- |
| **`options`** | <code>{ jwt: string; }</code> |

--------------------


### Interfaces


#### ApplePassRef

Identifies a pass already in Apple Wallet.

| Prop                     | Type                |
| ------------------------ | ------------------- |
| **`passTypeIdentifier`** | <code>string</code> |
| **`serialNumber`**       | <code>string</code> |


#### AddButtonSize

| Prop         | Type                |
| ------------ | ------------------- |
| **`width`**  | <code>number</code> |
| **`height`** | <code>number</code> |


#### AddButtonFrame

CSS px from `getBoundingClientRect()` (= points relative to the web view).

| Prop    | Type                |
| ------- | ------------------- |
| **`x`** | <code>number</code> |
| **`y`** | <code>number</code> |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |

</docgen-api>

## Support

If this plugin saves you time, you can support its development via [PayPal](https://paypal.me/MinhVDV).

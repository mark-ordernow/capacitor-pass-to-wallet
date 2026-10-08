export interface PassToWalletPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}

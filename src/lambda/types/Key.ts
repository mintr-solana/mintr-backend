export interface Key {
  name: string;
  /**
   * Private key
   */
  privateKey: Uint8Array;
  /**
   * Base58 encoded public key
   */
  publicKey: string;
}
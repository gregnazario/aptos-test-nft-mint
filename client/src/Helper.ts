import { Network, Provider, Types } from "aptos";
import {
  AccountInfo,
  TransactionOptions,
} from "@aptos-labs/wallet-adapter-core";

/*
 * A helper central place for common code across components
 */

export const DEVNET_PROVIDER = new Provider(Network.DEVNET);
export const TESTNET_PROVIDER = new Provider(Network.TESTNET);
export const MAINNET_PROVIDER = new Provider(Network.MAINNET);

export type TransactionContext = {
  network: Network;
  account: AccountInfo | null;
  submitTransaction: SubmitTransaction;
};
export type SubmitTransaction = <T extends Types.TransactionPayload>(
  transaction: T,
  options?: TransactionOptions,
) => Promise<any>;

export const getProvider = (network: Network) => {
  if (network === Network.MAINNET) {
    return MAINNET_PROVIDER;
  } else if (network === Network.TESTNET) {
    return TESTNET_PROVIDER;
  } else if (network === Network.DEVNET) {
    return DEVNET_PROVIDER;
  }
  throw new Error("Unknown network type");
};

export const runTransaction = async <T extends Types.TransactionPayload>(
  txnContext: TransactionContext,
  payload: T,
) => {
  try {
    const provider = getProvider(txnContext.network);
    const response = await txnContext.submitTransaction(payload);
    await provider.aptosClient.waitForTransaction(response.hash);
    let txn = (await provider.aptosClient.getTransactionByHash(
      response.hash,
    )) as any;
    return txn;
  } catch (error: any) {
    console.log("Failed to wait for txn" + error);
  }

  return undefined;
};

// FIXME: All of these should be exported from the SDK
declare type ViewRequest = {
  function: string;
  /**
   * Type arguments of the function
   */
  type_arguments: Array<string>;
  /**
   * Arguments of the function
   */
  arguments: Array<any>;
};

export const runViewFunction = async (
  txnContext: TransactionContext,
  payload: ViewRequest,
) => {
  try {
    const provider = getProvider(txnContext.network);
    return await provider.aptosClient.view(payload);
  } catch (error: any) {
    console.log("Failed to wait for txn" + error);
  }

  return undefined;
};

export const onStringChange = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setter: (value: ((prevState: string) => string) | string) => void,
): Promise<string> => {
  const val = event.target.value;
  setter(val);
  return val;
};

export const onNumberChange = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setter: (value: ((prevState: number) => number) | number) => void,
) => {
  const val = event.target.value;
  setter(Number(val));
};
export const onBigIntChange = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setter: (value: ((prevState: bigint) => bigint) | bigint) => void,
) => {
  const val = event.target.value;
  setter(BigInt(val));
};

export const ensureImageUri = async (uri: string) => {
  // Empty means something's wrong anyways
  if (!uri) {
    return uri;
  }
  try {
    if (
      !uri.endsWith(".jpg") &&
      !uri.endsWith(".jpeg") &&
      !uri.endsWith(".png") &&
      !uri.endsWith(".svg")
    ) {
      uri = ensureHttps(uri);
      let response = await fetch(uri);
      const data = await response.json();
      if (data.image) {
        uri = ensureHttps(data.image);
      }
    }
  } catch (error: any) {
    // Let the URI stay as the old one for now
  }
  return uri;
};

export const ensureHttps = (uri: string): string => {
  if (uri.startsWith("ipfs://")) {
    uri = uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
  }
  return uri;
};

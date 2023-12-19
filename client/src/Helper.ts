import {
  AccountInfo,
  InputTransactionData,
} from "@aptos-labs/wallet-adapter-core";
import React from "react";
import { Aptos, AptosConfig, Network, ViewRequest } from "@aptos-labs/ts-sdk";
/* eslint-disable @typescript-eslint/no-use-before-define */

/*
 * A helper central place for common code across components
 */

export const DEVNET_PROVIDER = new Aptos(
  new AptosConfig({ network: Network.DEVNET }),
);
export const TESTNET_PROVIDER = new Aptos(
  new AptosConfig({ network: Network.TESTNET }),
);
export const MAINNET_PROVIDER = new Aptos(
  new AptosConfig({ network: Network.MAINNET }),
);

export type TransactionContext = {
  network: Network;
  account: AccountInfo | null;
  submitTransaction: SubmitTransaction;
};
export type SubmitTransaction = (data: InputTransactionData) => Promise<any>;

export const getProvider = (network: Network) => {
  if (network === Network.MAINNET) {
    return MAINNET_PROVIDER;
  }
  if (network === Network.TESTNET) {
    return TESTNET_PROVIDER;
  }
  if (network === Network.DEVNET) {
    return DEVNET_PROVIDER;
  }
  throw new Error("Unknown network type");
};

export const runTransaction = async (
  txnContext: TransactionContext,
  payload: InputTransactionData,
) => {
  try {
    const provider = getProvider(txnContext.network);
    const response = await txnContext.submitTransaction(payload);
    await provider.waitForTransaction({ transactionHash: response.hash });
    return await provider.getTransactionByHash({
      transactionHash: response.hash,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.log(`Failed to wait for txn ${error}`);
  }

  return undefined;
};

export const runViewFunction = async (
  txnContext: TransactionContext,
  payload: ViewRequest,
) => {
  try {
    const provider = getProvider(txnContext.network);
    return await provider.view({ payload });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.log(`Failed to wait for txn ${error}`);
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
    let newUri = uri;
    if (
      !uri.endsWith(".jpg") &&
      !uri.endsWith(".jpeg") &&
      !uri.endsWith(".png") &&
      !uri.endsWith(".svg")
    ) {
      newUri = ensureHttps(uri);
      const response = await fetch(uri);
      const data = await response.json();
      if (data.image) {
        newUri = ensureHttps(data.image);
      }
    }

    return newUri;
  } catch (error: any) {
    // Let the URI stay as the old one for now
  }
  return uri;
};

export const ensureHttps = (uri: string): string => {
  let newUri = uri;
  if (uri.startsWith("ipfs://")) {
    newUri = uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
  }
  return newUri;
};

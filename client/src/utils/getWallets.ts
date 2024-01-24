import { FewchaWallet } from "fewcha-plugin-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { MSafeWalletAdapter } from "@msafe/aptos-wallet-adapter";
import { ShadowWallet } from "@flipperplatform/wallet-adapter-plugin";
import { OKXWallet } from "@okwallet/aptos-wallet-adapter";
import { NightlyWallet } from "@nightlylabs/aptos-wallet-adapter-plugin";
import { OpenBlockWallet } from "@openblockhq/aptos-wallet-adapter";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { TokenPocketWallet } from "@tp-lab/aptos-wallet-adapter";
import { TrustWallet } from "@trustwallet/aptos-wallet-adapter";
import { WelldoneWallet } from "@welldone-studio/aptos-wallet-adapter";
import { IdentityConnectWallet } from "@identity-connect/wallet-adapter-plugin";
import { Network } from "@aptos-labs/ts-sdk";

import {
  NetworkName,
} from "@aptos-labs/wallet-adapter-react";

const icDappId = "9cfd33d8-80a9-4e0b-9c7b-195e8a241aa0";
const DEVNET_WALLETS = [
  new IdentityConnectWallet(icDappId, { networkName: NetworkName.Devnet }),
  new PetraWallet(),
  new FewchaWallet(),
  new MartianWallet(),
  new MSafeWalletAdapter(),
  new NightlyWallet(),
  new OpenBlockWallet(),
  new PontemWallet(),
  new RiseWallet(),
  new ShadowWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
];
const TESTNET_WALLETS = [
  new IdentityConnectWallet(icDappId, { networkName: NetworkName.Testnet }),
  new PetraWallet(),
  new FewchaWallet(),
  new MartianWallet(),
  new MSafeWalletAdapter(),
  new NightlyWallet(),
  new OpenBlockWallet(),
  new PontemWallet(),
  new RiseWallet(),
  new ShadowWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
];
const MAINNET_WALLETS = [
  new IdentityConnectWallet(icDappId, { networkName: NetworkName.Mainnet }),
  new PetraWallet(),
  new FewchaWallet(),
  new MartianWallet(),
  new MSafeWalletAdapter(),
  new NightlyWallet(),
  new OKXWallet(),
  new OpenBlockWallet(),
  new PontemWallet(),
  new RiseWallet(),
  new ShadowWallet(),
  new TokenPocketWallet(),
  new TrustWallet(),
  new WelldoneWallet(),
];

export const getWallets = (network: string) => {
  switch(network){
    case Network.DEVNET: 
      return DEVNET_WALLETS;
    case Network.TESTNET: 
      return TESTNET_WALLETS;
    case Network.MAINNET: 
      return MAINNET_WALLETS;
    default:
      return MAINNET_WALLETS;
  }
}
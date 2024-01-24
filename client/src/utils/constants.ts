import { Network } from "@aptos-labs/ts-sdk";

export const INSCRIPTON_MODULE_ADDRESS =
  "0x52f9250619e7695127b04d02d608b32d75bce6720568b766d5d54dc1961b9649";
export const MODULE_ADDRESS =
  "0x6de37368e31dff4580b211295198159ee6f98b42ffa93c5683bb955ca1be67e0";
export const DEVNET_FEE_SCHEDULE =
  "0x96e6143a72d9cb40872972c241112ecb43cc0ca8aca376a940a182d620ccef1c";
export const TESTNET_FEE_SCHEDULE =
  "0xc261491e35296ffbb760715c2bb83b87ced70029e82e100ff53648b2f9e1a598";
export const MAINNET_ZERO_FEE_SCHEDULE =
  "0x8bff03d355bb35d2293ae5be7b04b9648be2f3694fb3fc537267ecb563743e00";
export const DEFAULT_PRICE = "100000000";

export const defaultFeeSchedule = (network: Network) => {
    if (network === Network.MAINNET) {
      return MAINNET_ZERO_FEE_SCHEDULE;
    }
    if (network === Network.TESTNET) {
      return TESTNET_FEE_SCHEDULE;
    }
    if (network === Network.DEVNET) {
      return DEVNET_FEE_SCHEDULE;
    }
  
    throw new Error("Unsupported network");
  };
  

export const LAUNCHPAD = "launchpad";
export const MARKETPLACE = "marketplace";
export const WALLET = "wallet";
export const CONTRACT = "contract";
export const SOURCE = "source";

export const APT = 1E8;
export const V1 = "V1";
export const V2 = "V2";
export const FIXED_PRICE = "Fixed Price";
export const AUCTION = "Auction";
export const TOKEN_OFFERS = "Token Offers";
export const COLLECTION_OFFERS = "Collection Offers";

export const APTOS_COIN: string = "0x1::aptos_coin::AptosCoin";
export const COIN_LISTING: string = "coin_listing";
export const COLLECTION_OFFER: string = "collection_offer";
export const TOKEN_OFFER: string = "token_offer";
export const FEE_SCHEDULE: string = "fee_schedule";
export const LISTING: string = "listing";

export const toApt = (num: string | number): number => Number(num) / APT;
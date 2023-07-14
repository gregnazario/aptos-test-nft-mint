import {Provider, Types} from "aptos";
import {AccountInfo} from "@aptos-labs/wallet-adapter-core";

/*
 * A helper central place for common code across components
 */

// TODO: Support multiple networks
export const DEVNET_PROVIDER = new Provider({
    fullnodeUrl: "https://fullnode.devnet.aptoslabs.com",
    indexerUrl: "https://ideal-cricket-94.hasura.app/v1/graphql"
})

export type TransactionContext = { account: AccountInfo | null, submitTransaction: SubmitTransaction };
export type SubmitTransaction = <T extends Types.TransactionPayload, V>(transaction: T, options?: V) => Promise<any>;
export const runTransaction = async <T extends Types.TransactionPayload>(submitTransaction: SubmitTransaction, payload: T) => {
    try {
        const response = await submitTransaction(payload);
        await DEVNET_PROVIDER.aptosClient.waitForTransaction(response.hash);
        let txn = await DEVNET_PROVIDER.aptosClient.getTransactionByHash(response.hash) as any;
        return txn;
    } catch (error: any) {
        console.log("Failed to wait for txn" + error)
    }

    return undefined;
}

export const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
    const val = event.target.value;
    setter(val);
}

export const onNumberChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: number) => number) | number)) => void) => {
    const val = event.target.value;
    setter(Number(val));
}
export const onBigIntChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: bigint) => bigint) | bigint)) => void) => {
    const val = event.target.value;
    setter(BigInt(val));
}

import {Button, Col, Input, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Network, Provider} from "aptos";
import {useWallet} from "@aptos-labs/wallet-adapter-react";
import {useState} from "react";

export const DEVNET_PROVIDER = new Provider(Network.DEVNET)

function Transfer(this: any) {
    const [objectAddress, setObjectAddress] = useState<string>("");
    const [destinationAddress, setDestinationAddress] = useState<string>("");
    const [numTransaction, setNumTransaction] = useState<number>(0);
    const [transactions, setTransactions] = useState<{ num: number, hash: string, type: string, data: string }[]>([]);
    const {account, signAndSubmitTransaction} = useWallet();
    const onStringChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: (value: (((prevState: string) => string) | string)) => void) => {
        const val = event.target.value;
        setter(val);
    }

    const addToTransactions = async (type: string, hash: string, data: string) => {
        const txns = transactions;
        const num = numTransaction;
        txns.push({num: num, hash: hash, type: type, data: data});
        setTransactions(txns);
        setNumTransaction(num + 1);
    }

    const transferObject = async () => {
        // Ensure you're logged in
        if (!account || !objectAddress) return [];
        const type = "Transfer Object";
        const payload = {
            type: "entry_function_payload",
            function: `0x1::object::transfer`,
            type_arguments: ["0x1::object::ObjectCore"],
            arguments: [objectAddress, destinationAddress],
        };
        let txn = await runTransaction(type, payload);
        if (txn !== undefined) {
            await addToTransactions(type, txn.hash, "");
        }
    }

    const runTransaction = async (type: string, payload: any) => {
        try {
            const response = await signAndSubmitTransaction(payload);
            console.log(`${type}: ${response.hash}`);
            await DEVNET_PROVIDER.aptosClient.waitForTransaction(response.hash);
            let txn = await DEVNET_PROVIDER.aptosClient.getTransactionByHash(response.hash) as any;
            return txn;
        } catch (error: any) {
            console.log("Failed to wait for txn" + error)
        }

        return undefined;
    }

    return (
        <>
            <Row align={"middle"}>
                <Col span={4}>
                    <h3>Transfer Object</h3>
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Object address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setObjectAddress)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Object Address"
                        size="large"
                        defaultValue={""}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={4}>
                    <p>Destination address: </p>
                </Col>
                <Col flex={"auto"}>
                    <Input
                        onChange={(event) => {
                            onStringChange(event, setDestinationAddress)
                        }}
                        style={{width: "calc(100% - 60px)"}}
                        placeholder="Destination Address"
                        size="large"
                        defaultValue={""}
                    />
                </Col>
            </Row>
            <Row align="middle">
                <Col span={2} offset={4}>
                    <Button
                        onClick={() => transferObject()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Transfer Object
                    </Button>
                </Col>
            </Row>
        </>
    );
}

export default Transfer;
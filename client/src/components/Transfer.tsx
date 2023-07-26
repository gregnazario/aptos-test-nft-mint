import {Button, Col, Input, Row} from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import {Fragment, useState} from "react";
import {onStringChange, runTransaction, TransactionContext} from "../Helper";

export function Transfer(props: { ctx: TransactionContext, objectAddress: string }) {
    const [destinationAddress, setDestinationAddress] = useState<string>("");

    const transferObject = async () => {
        // Ensure you're logged in
        if (!props.ctx.account || !props.objectAddress) return [];
        const payload = {
            type: "entry_function_payload",
            function: `0x1::object::transfer`,
            type_arguments: ["0x1::object::ObjectCore"],
            arguments: [props.objectAddress, destinationAddress],
        };
        await runTransaction(props.ctx, payload);
    }

    return (<Fragment key={"transfer_object"}>
            <Row align="middle">
                <Col span={6}>
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
                <Col span={4} offset={4}>
                    <Button
                        onClick={() => transferObject()}
                        type="primary"
                        style={{height: "40px", backgroundColor: "#3f67ff"}}
                    >
                        Transfer Object
                    </Button>
                </Col>
            </Row>
        </Fragment>
    );
}
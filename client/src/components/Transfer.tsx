import { Col, Input, Row } from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Fragment, useEffect, useState } from "react";
import { MoveFunctionId } from "@aptos-labs/ts-sdk";
import { runTransaction, TransactionContext } from "../Helper";
// eslint-disable-next-line import/no-cycle
import { resolveToAddress } from "../pages/Wallet";

export function Transfer(props: {
  ctx: TransactionContext;
  objectAddress: string;
  submit: boolean;
  submitCallback: () => void;
}) {
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  useEffect(() => {
    if (props.submit) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      transferObject();
    }
  }, [props.submit]);

  const transferObject = async () => {
    // Ensure you're logged in
    if (!props.ctx.account || !props.objectAddress) return;
    const payload = {
      data: {
        function: "0x1::object::transfer" as MoveFunctionId,
        typeArguments: ["0x1::object::ObjectCore"],
        functionArguments: [props.objectAddress, destinationAddress],
      },
    };
    await runTransaction(props.ctx, payload);
    props.submitCallback();
  };

  return (
    <Fragment key={"transfer_object"}>
      <Row align="middle">
        <Col span={6}>
          <p>Destination address: </p>
        </Col>
        <Col flex={"auto"}>
          <Input
            onChange={async (event) => {
              const address = await resolveToAddress(event.target.value);
              setDestinationAddress(address);
            }}
            style={{ width: "calc(100% - 60px)" }}
            placeholder="Destination Address"
            size="large"
            defaultValue={""}
          />
        </Col>
      </Row>
    </Fragment>
  );
}

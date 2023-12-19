import { Col, Input, Row } from "antd";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Fragment, useEffect, useState } from "react";
import { runTransaction, TransactionContext } from "../Helper";
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
      transferObject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.submit]);

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
              let address = await resolveToAddress(event.target.value);
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

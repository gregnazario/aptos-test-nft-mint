import { Row, Col } from "antd";

export function EasyBorder(props: {
    offset: number;
    children?: React.ReactNode;
  }) {
    return (
      <Row align={"middle"}>
        <Col offset={props.offset} flex={"auto"}>
          {props.children}
        </Col>
        <Col span={props.offset} />
      </Row>
    );
  }
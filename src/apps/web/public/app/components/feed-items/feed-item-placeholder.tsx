import { Badge, Card, Col, Placeholder } from "react-bootstrap";

const FeedItemPlaceholder = () => (
  <Col>
    <Card className="mx-2 mb-2">
      <Card.Body>
        <Placeholder as="div" style={{ aspectRatio: 16 / 9 }} animation="wave">
          <Placeholder xs={12} style={{ height: "100%" }} />
        </Placeholder>
        <Placeholder as={Card.Title} animation="wave">
          <Placeholder xs={6} />
        </Placeholder>
        <Placeholder as={Card.Subtitle} className="mb-2 text-muted" animation="wave">
          <Placeholder xs={4} />
        </Placeholder>
        <br />
        <br />
        <Placeholder as={Badge} bg="info" animation="wave">
          <Placeholder xs={4} style={{ width: "40px" }} />
        </Placeholder>
      </Card.Body>
    </Card>
  </Col>
);

export default FeedItemPlaceholder;

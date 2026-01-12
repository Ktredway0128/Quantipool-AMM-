import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from "react-router-bootstrap";


const Tabs = () => {
    return (
        <Nav variant="pills" defaultActiveKey="/" className='justify-content-center my-4'>
            <LinkContainer to="/">
                <Nav.Link className="submit-buttons mx-2">Trade</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/deposit">
                <Nav.Link className="submit-buttons mx-2">Deposit</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/withdraw">
                <Nav.Link className="submit-buttons mx-2">Withdraw</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/charts">
                <Nav.Link className="submit-buttons mx-2">History</Nav.Link>
            </LinkContainer>
        </Nav>
    );
}

export default Tabs;
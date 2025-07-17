import pytest
from api import app, socketio

@pytest.fixture
def client():
    c = socketio.test_client(app)
    yield c
    c.disconnect()


def test_basic_connect_and_expect(client):
    client.emit("sequence", [
        {"type": "connect", "connprivkey": "03"},
        {"type": "expect", "msg_name": "init", "connprivkey": "03"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "message" for m in msgs)


def test_send_and_expect(client):
    client.emit("sequence", [
        {"type": "connect", "connprivkey": "02"},
        {"type": "send", "msg_name": "init", "connprivkey": "02"},
        {"type": "expect", "msg_name": "init", "connprivkey": "02"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "message" for m in msgs)


def test_unknown_message_type(client):
    client.emit("sequence", [
        {"type": "connect", "connprivkey": "03"},
        {"type": "send", "msg_name": "foobar", "connprivkey": "03"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "error" for m in msgs)


def test_disconnect_without_connect(client):
    client.emit("sequence", [
        {"type": "disconnect", "connprivkey": "nonexistent"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "error" for m in msgs)


def test_multiple_connections(client):

    client.emit("sequence", [
        {"type": "connect", "connprivkey": "01"},
        {"type": "connect", "connprivkey": "02"},
        {"type": "disconnect", "connprivkey": "01"},
        {"type": "disconnect", "connprivkey": "02"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "message" for m in msgs)


def test_missing_fields(client):
    # Missing connprivkey for connect
    client.emit("sequence", [
        {"type": "connect"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "error" for m in msgs)


def test_invalid_event_type(client):
    client.emit("sequence", [
        {"type": "foobar", "connprivkey": "01"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "error" for m in msgs)


def test_send_and_expect_ping_pong(client):
    client.emit("sequence", [
        {"type": "connect", "connprivkey": "04"},
        {"type": "send", "msg_name": "ping", "connprivkey": "04"},
        {"type": "expect", "msg_name": "pong", "connprivkey": "04"},
        {"type": "disconnect", "connprivkey": "04"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "message" for m in msgs)


def test_sequence_with_multiple_expects(client):
    client.emit("sequence", [
        {"type": "connect", "connprivkey": "05"},
        {"type": "send", "msg_name": "init", "connprivkey": "05"},
        {"type": "expect", "msg_name": "init", "connprivkey": "05"},
        {"type": "send", "msg_name": "ping", "connprivkey": "05"},
        {"type": "expect", "msg_name": "pong", "connprivkey": "05"},
        {"type": "disconnect", "connprivkey": "05"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "message" for m in msgs)


def test_ping_pong_auto_response(client):
    # Connect and send a ping, expect pong in response
    client.emit("sequence", [
        {"type": "connect", "connprivkey": "06"},
        {"type": "send", "msg_name": "ping", "connprivkey": "06"},
        {"type": "expect", "msg_name": "pong", "connprivkey": "06"},
        {"type": "disconnect", "connprivkey": "06"}
    ])
    msgs = client.get_received()
    assert any(m["name"] == "message" for m in msgs)

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

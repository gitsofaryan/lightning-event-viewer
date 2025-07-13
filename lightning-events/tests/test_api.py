import pytest
from api import app, socketio
from flask_socketio import SocketIOTestClient

@pytest.fixture
def client():
    return SocketIOTestClient(app, socketio)

def test_sequence(client):
    # Step 1-2: Connect (init -> connected)
    client.emit('message', {'type': 'connect', 'connprivkey': '01' * 32})
    received = client.get_received()
    assert any(e['name'] == 'connection' for e in received), "Missing connection event"
    assert any(e['name'] == 'received' and e['args'][0]['message'] == 'init' for e in received), "Missing received:init event"
    assert any(e['name'] == 'done' for e in received), "Missing done event"

    # Step 3-4: Ping -> Pong
    client.emit('message', {'type': 'send', 'message': 'ping', 'connprivkey': '01' * 32})
    client.emit('message', {'type': 'expect', 'message': 'pong', 'connprivkey': '01' * 32})
    received = client.get_received()
    assert any(e['name'] == 'sent' and e['args'][0]['message'] == 'ping' for e in received), "Missing sent:ping event"
    assert any(e['name'] == 'received' and e['args'][0]['message'] == 'pong' for e in received), "Missing received:pong event"
    assert any(e['name'] == 'done' for e in received), "Missing done event"

    # Step 5-6: RawMsg (warning) -> Expect (error)
    client.emit('message', {'type': 'send', 'message': 'warning', 'connprivkey': '01' * 32})
    client.emit('message', {'type': 'expect', 'message': 'error', 'connprivkey': '01' * 32})
    received = client.get_received()
    assert any(e['name'] == 'sent' and e['args'][0]['message'] == 'warning' for e in received), "Missing sent:warning event"
    assert any(e['name'] == 'received' and e['args'][0]['message'] == 'error' for e in received), "Missing received:error event"
    assert any(e['name'] == 'done' for e in received), "Missing done event"

    # Step 7: Complete
    client.emit('message', {'type': 'complete'})
    received = client.get_received()
    assert any(e['name'] == 'done' and e['args'][0]['status'] == 'complete' for e in received), "Missing done:complete event"
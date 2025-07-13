import pytest
import logging
from api import app, socketio
from flask_socketio import SocketIOTestClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@pytest.fixture
def client():
    return SocketIOTestClient(app, socketio)

def test_sequence(client):
    sequence = [
        {'type': 'connect', 'connprivkey': '01' * 32},
        {'type': 'send', 'message': 'init'},
        {'type': 'expect', 'message': 'init'}
    ]
    
    logger.info(f"Starting test sequence with {len(sequence)} steps")
    for i, step in enumerate(sequence):
        logger.info(f"Step {i+1}: {step}")
    
    client.emit('start_sequence', {'sequence': sequence})
    received = client.get_received()
    
    logger.info(f"Received {len(received)} events")
    for event in received:
        logger.info(f"Event: {event['name']}")
    
    assert any(e['name'] == 'connection' for e in received)
    assert any(e['name'] == 'sent' for e in received)
    assert any(e['name'] == 'received' for e in received)
    assert any(e['name'] == 'done' for e in received)
    
    logger.info("Test sequence completed successfully")
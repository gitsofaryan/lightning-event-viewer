from flask import Flask
from flask_socketio import SocketIO, emit
from lnprototest import DummyRunner
from model import WsConnect, WsExpectMsg, WsRawMsg
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockConfig:
    def getoption(self, name): return False if name == "verbose" else None

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
runner = DummyRunner(MockConfig())

@socketio.on('start_sequence')
def handle_sequence(data):
    try:
        events = []
        for event in data.get('sequence', []):
            connprivkey = event.get('connprivkey', '01' * 32)
            etype = event.get('type')
            if etype == 'connect':
                events.append(WsConnect(connprivkey))
            elif etype == 'send':
                events.append(WsRawMsg(event['message'], connprivkey=connprivkey))
            elif etype == 'expect':
                events.append(WsExpectMsg(event['message'], connprivkey=connprivkey))
            else:
                emit('error', {'error': f'Unknown event type: {etype}'})
                return
        runner.run(events)
        emit('done', {'status': 'success'})
    except Exception as e:
        logger.error(f"Sequence error: {e}")
        emit('error', {'error': str(e)})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
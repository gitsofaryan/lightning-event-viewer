from flask import Flask
from flask_socketio import SocketIO, emit
from lnprototest import DummyRunner
from model import WsConnect, WsRawMsg, WsExpectMsg, WsComplete
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockConfig:
    def getoption(self, name): return False if name == "verbose" else None

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
runner = DummyRunner(MockConfig())

@socketio.on('message')
def handle_message(data):
    try:
        etype = data.get('type')
        connprivkey = data.get('connprivkey', '01' * 32)
        if etype == 'connect':
            runner.run([WsConnect(connprivkey), WsExpectMsg('init', connprivkey=connprivkey)])
        elif etype == 'send':
            runner.run([WsRawMsg(data['message'], connprivkey=connprivkey)])
        elif etype == 'expect':
            runner.run([WsExpectMsg(data['message'], connprivkey=connprivkey)])
        elif etype == 'complete':
            runner.run([WsComplete()])
        else:
            emit('error', {'error': f'Unknown event type: {etype}'})
            return
        emit('done', {'status': 'success'})
    except Exception as e:
        logger.error(f"Error: {e}")
        emit('error', {'error': str(e)})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
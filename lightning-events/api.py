from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS  # <-- Add this import
from lnprototest.dummyrunner import DummyRunner
from lnprototest.errors import SpecFileError
from model import WsConnect, WsRawMsg, WsExpectMsg, WsDisconnect
import logging
import json
import time  # Add this import if not present

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # <-- Enable CORS for all routes
socketio = SocketIO(app, cors_allowed_origins="*")

class DummyConfig:
    def getoption(self, name):
        return False

# Global runner - persists across requests (Vincent's requirement)
global_runner = DummyRunner(DummyConfig())

@app.route('/sequence', methods=['POST'])
def run_sequence():
    # Log incoming request
    logger.info(f"\n{'='*50}")
    logger.info("INCOMING API REQUEST")
    logger.info(f"{'='*50}")
    logger.info(f"Method: {request.method}")
    logger.info(f"URL: {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"Content-Type: {request.content_type}")
    logger.info(f"JSON Data: {request.json}")
    logger.info(f"Raw Data: {request.data}")
    logger.info(f"{'='*50}")
    
    events = request.json
    if not events:
        error_response = {"error": "No events provided"}
        logger.info(f"RESPONSE: 400 - {error_response}")
        socketio.emit('protocol_message', {
            'direction': 'in',
            'event': 'error',
            'data': error_response,
            'timestamp': int(time.time() * 1000)
        })
        return jsonify(error_response), 400
        
    mapped = []
    
    try:
        for e in events:
            t = e.get("type")
            logger.info(f"Processing event: {e}")
            
            if t == "connect":
                mapped.append(WsConnect(e["connprivkey"]))
            elif t == "send":
                mapped.append(WsRawMsg(e["msg_name"], e["connprivkey"]))
            elif t == "expect":
                mapped.append(WsExpectMsg(e["msg_name"], e["connprivkey"]))
            elif t == "disconnect":
                mapped.append(WsDisconnect(e["connprivkey"]))
            else:
                error_response = {"error": f"Unknown event type '{t}'"}
                logger.info(f"RESPONSE: 400 - {error_response}")
                socketio.emit('protocol_message', {
                    'direction': 'in',
                    'event': 'error',
                    'data': error_response,
                    'timestamp': int(time.time() * 1000)
                })
                return jsonify(error_response), 400
        
        logger.info(f"Running {len(mapped)} events with global_runner")
        # Use global runner - Vincent's key requirement
        global_runner.run(mapped)
        
        # Emit sequence_complete event to all clients
        socketio.emit('sequence_complete', {'status': 'complete', 'events_processed': len(mapped)})
        
        success_response = {"status": "ok", "events_processed": len(mapped)}
        logger.info(f"RESPONSE: 200 - {success_response}")
        return jsonify(success_response)
        
    except SpecFileError as exc:
        error_response = {"error": f"Protocol error: {str(exc)}"}
        logger.info(f"RESPONSE: 400 - {error_response}")
        socketio.emit('error', error_response)
        print("EMITTING WS MESSAGE:", {'direction': 'in', 'event': 'error', 'data': error_response})
        socketio.emit('protocol_message', {
            'direction': 'in',
            'event': 'error',
            'data': error_response,
            'timestamp': int(time.time() * 1000)
        })
        return jsonify(error_response), 400
    except Exception as exc:
        error_response = {"error": f"Execution failed: {str(exc)}"}
        logger.info(f"RESPONSE: 500 - {error_response}")
        socketio.emit('error', error_response)
        print("EMITTING WS MESSAGE:", {'direction': 'in', 'event': 'error', 'data': error_response})
        socketio.emit('protocol_message', {
            'direction': 'in',
            'event': 'error',
            'data': error_response,
            'timestamp': int(time.time() * 1000)
        })
        return jsonify(error_response), 500
    

@app.route('/test_emit')
def test_emit():
    import time
    msg = {
        'direction': 'in',
        'event': 'test',
        'data': {'msg': 'test'},
        'timestamp': int(time.time() * 1000)
    }
    print("EMITTING TEST WS MESSAGE:", msg)
    socketio.emit('protocol_message', msg)
    return 'ok'

if __name__ == "__main__":
    socketio.run(app, debug=True)

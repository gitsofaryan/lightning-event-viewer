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

global_runner = DummyRunner(DummyConfig())

@app.route('/sequence', methods=['POST'])
def run_sequence():
    logger.info(f'{request}')
    
    events = request.json
    if not events:
        error_response = {"error": "No events provided"}
        logger.info(f"RESPONSE: 400 - {error_response}")
        return jsonify(error_response), 400
        
    mapped = []
    try:
        for e in events:
            t = e.get("type")
            logger.info(f"Processing event: {e}")
             
            if t == "connect":
                mapped.append(WsConnect(e["connprivkey"]))
            elif t == "send":
                mapped.append(WsRawMsg(e["msg"]['type'], e['msg']['connprivkey']))
                #mapped.append(WsExpectMsg(e['msg']['type'], e['msg']['connprivkey']))
       
        logger.info(f"Running {len(mapped)} events with global_runner")
        global_runner.run(mapped)
        
        success_response = {"status": "ok", "events_processed": len(mapped)}
        logger.info(f"RESPONSE: 200 - {success_response}")
        return jsonify(success_response)
    except Exception as exc:
        error_response = {"error": f"Execution failed: {str(exc)}"}
        logger.info(f"RESPONSE: 500 - {error_response}")
        return jsonify(error_response), 500
    
if __name__ == "__main__":
    socketio.run(app, debug=True)
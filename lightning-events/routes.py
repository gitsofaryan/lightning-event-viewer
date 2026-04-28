from flask import Blueprint, request, jsonify
from lnprototest.dummyrunner import DummyRunner
from model import WsConnect, WsRawMsg, WsExpectMsg, WsDisconnect
import logging
import time

logger = logging.getLogger(__name__)

sequence_bp = Blueprint('sequence_bp', __name__)

@sequence_bp.route('/heartbeat', methods=['GET'])
def heartbeat():
    return jsonify({"status": "alive", "timestamp": int(time.time() * 1000)})

class DummyConfig:

    def getoption(self, name):
        return False

@sequence_bp.route('/sequence', methods=['POST'])
def run_sequence():
    logger.info(f'Processing {request.method} request to {request.path}')
    
    events = request.json
    if not events:
        error_response = {"error": "No events provided"}
        logger.warning(f"RESPONSE: 400 - {error_response}")
        return jsonify(error_response), 400
        
    mapped = []
    try:
        for e in events:
            t = e.get("type")
            is_hk = e.get("is_housekeeping", False)
            # Support both {msg: {type: 'init'}} and {msg_name: 'init'} formats
            msg = e.get('msg', {})
            msg_name = e.get('msg_name') or msg.get('type')
            connprivkey = e.get('connprivkey') or msg.get('connprivkey')
            args = e.get('content') or msg.get('content') or {}

            if not connprivkey:
                connprivkey = "03" # Default

            if t == "connect":
                mapped.append(WsConnect(connprivkey, is_housekeeping=is_hk))
            elif t == "send":
                mapped.append(WsRawMsg(msg_name, connprivkey, is_housekeeping=is_hk, args=args))
            elif t == "expect":
                mapped.append(WsExpectMsg(msg_name, connprivkey, is_housekeeping=is_hk, args=args))
            elif t == "disconnect":
                mapped.append(WsDisconnect(connprivkey, is_housekeeping=is_hk))
            else:
                logger.warning(f"Skipping unknown event type: {t}")

       
        from model import LightningAppRunner
        runner = LightningAppRunner(DummyConfig())
        logger.info(f"Running sequence with {len(mapped)} events")
        runner.run(mapped)
        
        success_response = {"status": "ok", "events_processed": len(mapped)}
        return jsonify(success_response)
    except Exception as exc:
        error_response = {"error": f"Execution failed: {str(exc)}"}
        logger.error(f"Execution Error: {str(exc)}", exc_info=True)
        return jsonify(error_response), 500


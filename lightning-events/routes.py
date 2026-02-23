from flask import Blueprint, request, jsonify
from lnprototest.dummyrunner import DummyRunner
from model import WsConnect, WsRawMsg, WsExpectMsg, WsDisconnect
import logging

logger = logging.getLogger(__name__)

sequence_bp = Blueprint('sequence_bp', __name__)

class DummyConfig:
    def getoption(self, name):
        return False

@sequence_bp.route('/sequence', methods=['POST'])
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
            if "type" not in e:
                return jsonify({"error": "Event missed 'type' field"}), 400
                
            t = e.get("type")
            logger.info(f"Processing event: {e}")
             
            is_hk = e.get("is_housekeeping", False)
            if t == "connect":
                if "connprivkey" not in e:
                    return jsonify({"error": "Connect event is missing 'connprivkey'"}), 400
                obj = WsConnect(e["connprivkey"])
                obj.is_housekeeping = is_hk
                mapped.append(obj)
            elif t == "send":
                if "msg" not in e:
                    return jsonify({"error": "Send event is missing 'msg'"}), 400
                msg = e["msg"]
                if "type" not in msg or "connprivkey" not in msg:
                    return jsonify({"error": "Send event 'msg' must contain 'type' and 'connprivkey'"}), 400
                obj = WsRawMsg(msg['type'], msg['connprivkey'])
                obj.is_housekeeping = is_hk
                mapped.append(obj)
            elif t == "expect":
                if "msg" not in e:
                    return jsonify({"error": "Expect event is missing 'msg'"}), 400
                msg = e["msg"]
                if "type" not in msg or "connprivkey" not in msg:
                    return jsonify({"error": "Expect event 'msg' must contain 'type' and 'connprivkey'"}), 400
                obj = WsExpectMsg(msg['type'], msg['connprivkey'])
                obj.is_housekeeping = is_hk
                mapped.append(obj)
            elif t == "disconnect":
                 if "connprivkey" not in e:
                    return jsonify({"error": "Disconnect event is missing 'connprivkey'"}), 400
                 obj = WsDisconnect(e["connprivkey"])
                 obj.is_housekeeping = is_hk
                 mapped.append(obj)
            else:
                return jsonify({"error": f"Unknown event type '{t}'"}), 400
       
        # Instantiate runner locally to avoid global state collisions between concurrent requests
        # We use our custom LightningAppRunner instead of the default DummyRunner to support BOLT logic
        from model import LightningAppRunner
        runner = LightningAppRunner(DummyConfig())
        logger.info(f"Running {len(mapped)} events with local runner")
        runner.run(mapped)
        
        success_response = {"status": "ok", "events_processed": len(mapped)}
        logger.info(f"RESPONSE: 200 - {success_response}")
        return jsonify(success_response)
    except Exception as exc:
        error_response = {"error": f"Execution failed: {str(exc)}"}
        logger.info(f"RESPONSE: 500 - {error_response}")
        return jsonify(error_response), 500

from flask import Flask
from flask_socketio import SocketIO, emit
from lnprototest.dummyrunner import DummyRunner
from lnprototest.errors import SpecFileError
from model import WsConnect, WsRawMsg, WsExpectMsg, WsDisconnect

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

class DummyConfig:
    def getoption(self, name):
        return False

@socketio.on("sequence")
def run_sequence(events):
    runner = DummyRunner(DummyConfig())
    mapped = []
    try:
        for e in events:
            t = e.get("type")
            # Validate required fields for each event type
            if t == "connect":
                if "connprivkey" not in e:
                    emit("error", {"error": "Missing 'connprivkey' for connect event"})
                    return
                mapped.append(WsConnect(e["connprivkey"]))
            elif t == "send":
                if "msg_name" not in e or "connprivkey" not in e:
                    emit("error", {"error": "Missing 'msg_name' or 'connprivkey' for send event"})
                    return
                mapped.append(WsRawMsg(e["msg_name"], e["connprivkey"]))
            elif t == "expect":
                if "msg_name" not in e or "connprivkey" not in e:
                    emit("error", {"error": "Missing 'msg_name' or 'connprivkey' for expect event"})
                    return
                mapped.append(WsExpectMsg(e["msg_name"], e["connprivkey"]))
            elif t == "disconnect":
                if "connprivkey" not in e:
                    emit("error", {"error": "Missing 'connprivkey' for disconnect event"})
                    return
                mapped.append(WsDisconnect(e["connprivkey"]))
            else:
                emit("error", {"error": f"Unknown type {t}"})
                return
    except SpecFileError as exc:
        emit("error", {"error": str(exc)})
        return
    try:
        runner.run(mapped)
    except SpecFileError as exc:
        emit("error", {"error": str(exc)})


if __name__ == "__main__":
    socketio.run(app, debug=True)

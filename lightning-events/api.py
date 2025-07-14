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
    for e in events:
        t = e.get("type")
        if t == "connect":
            mapped.append(WsConnect(e["connprivkey"]))
        elif t == "send":
            mapped.append(WsRawMsg(e["msg_name"], e["connprivkey"]))
        elif t == "expect":
            mapped.append(WsExpectMsg(e["msg_name"], e["connprivkey"]))
        elif t == "disconnect":
            mapped.append(WsDisconnect(e["connprivkey"]))
        else:
            emit("error", {"error": f"Unknown type {t}"})
            return
    try:
        runner.run(mapped)
    except SpecFileError as exc:
        emit("error", {"error": str(exc)})

if __name__ == "__main__":
    socketio.run(app, debug=True)

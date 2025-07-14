from flask_socketio import emit
from lnprototest import Connect, RawMsg, ExpectMsg, Disconnect
from lnprototest.errors import SpecFileError

class WsConnect(Connect):
    def action(self, runner):
        super().action(runner)
        emit("message", {
            "direction": "connect",
            "msg_name": "init",
            "connprivkey": self.connprivkey
        })
        return True

class WsRawMsg(RawMsg):
    def action(self, runner):
        try:
            super().action(runner)
            emit("message", {
                "direction": "out",
                "msg_name": self.msgtype.name,
                "payload": getattr(self, "payload", b"").hex()
            })
        except Exception as e:
            emit("error", {"error": str(e)})
        return True

class WsExpectMsg(ExpectMsg):
    def action(self, runner):
        try:
            super().action(runner)
            emit("message", {
                "direction": "in",
                "msg_name": self.msgtype.name,
                "expected_fields": list(self.kwargs.keys())
            })
        except Exception as e:
            emit("error", {"error": str(e)})
        return True

class WsDisconnect(Disconnect):
    def action(self, runner):
        try:
            super().action(runner)
            emit("message", {
                "direction": "disconnect",
                "connprivkey": self.connprivkey
            })
        except SpecFileError as e:
            emit("error", {"error": str(e)})
        return True

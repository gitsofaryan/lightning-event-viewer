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
    def __init__(self, msg_name, connprivkey, *args, **kwargs):
        # Initialize RawMsg with correct message type
        from lnprototest.namespace import namespace
        msgtype = namespace().get_msgtype(msg_name)
        if not msgtype:
            raise SpecFileError(self, f"Unknown msgtype {msg_name}")
        # Store for later use in emit
        self.msgtype = msgtype
        self.connprivkey = connprivkey
        self.message = msgtype  # For compatibility with RawMsg
        super().__init__(msgtype, connprivkey, *args, **kwargs)

    def action(self, runner):
        try:
            super().action(runner)
            emit("message", {
                "direction": "out",
                "msg_name": self.msgtype.name,
                "payload": getattr(self, "payload", b"").hex() if hasattr(self, "payload") else ""
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

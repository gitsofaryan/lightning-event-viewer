from lnprototest import Connect, RawMsg, ExpectMsg, Disconnect
from lnprototest.errors import SpecFileError
import logging
import time

logger = logging.getLogger(__name__)

class WsConnect(Connect):
    def __repr__(self):
        return f"WsConnect(connprivkey={self.connprivkey})"

    def action(self, runner):
        result = super().action(runner)
        try:
            from flask_socketio import emit
            from api import socketio  # Import the socketio instance
            socketio.emit('message', {
                'sequence_id': 'connect_seq',
                'step': 1,
                'direction': 'out',
                'event': 'connect',
                'data': {'connprivkey': str(self.connprivkey)},
                'timestamp': int(time.time() * 1000)
            })
            logger.info(f"Broadcasted connect message")
        except Exception as e:
            logger.error(f"Error broadcasting connect message: {e}")
        return result

class WsRawMsg(RawMsg):
    def __repr__(self):
        msg_name = getattr(self, 'msgtype', None)
        msg_name = msg_name.name if msg_name and hasattr(msg_name, 'name') else None
        connprivkey = getattr(self, 'connprivkey', None)
        return f"WsRawMsg(msg_name={msg_name}, connprivkey={connprivkey})"

    def __init__(self, msg_name, connprivkey, *args, **kwargs):
        self.connprivkey = connprivkey  # Set early for error/debug
        from lnprototest.namespace import namespace
        msgtype = namespace().get_msgtype(msg_name)
        if not msgtype:
            raise SpecFileError(self, f"Unknown msgtype {msg_name}")
        self.msgtype = msgtype
        self.message = msgtype  # For compatibility with RawMsg
        super().__init__(msgtype, connprivkey, *args, **kwargs)

    def action(self, runner):
        result = super().action(runner)
        try:
            from flask_socketio import emit
            from api import socketio  # Import the socketio instance
            socketio.emit('message', {
                'sequence_id': 'raw_seq',
                'step': 2,
                'direction': 'out',
                'event': 'send',
                'data': {
                    'msg_name': getattr(self.msgtype, 'name', 'unknown'),
                    'connprivkey': str(self.connprivkey)
                },
                'timestamp': int(time.time() * 1000)
            })
            logger.info(f"Broadcasted raw message: {getattr(self.msgtype, 'name', 'unknown')}")
        except Exception as e:
            logger.error(f"Error broadcasting raw message: {e}")
        return result

class WsExpectMsg(ExpectMsg):
    def __repr__(self):
        msg_name = getattr(self, 'msgtype', None)
        msg_name = msg_name.name if msg_name and hasattr(msg_name, 'name') else None
        connprivkey = getattr(self, 'connprivkey', None)
        return f"WsExpectMsg(msg_name={msg_name}, connprivkey={connprivkey})"

    def __init__(self, msg_name, connprivkey, *args, **kwargs):
        self.connprivkey = connprivkey
        from lnprototest.namespace import namespace
        msgtype = namespace().get_msgtype(msg_name)
        if not msgtype:
            raise SpecFileError(self, f"Unknown msgtype {msg_name}")
        self.msgtype = msgtype
        super().__init__(msgtype, connprivkey, *args, **kwargs)

    def action(self, runner):
        result = super().action(runner)
        try:
            from flask_socketio import emit
            from api import socketio  # Import the socketio instance
            socketio.emit('message', {
                'sequence_id': 'expect_seq',
                'step': 3,
                'direction': 'in',
                'event': 'expect',
                'data': {
                    'msg_name': getattr(self.msgtype, 'name', 'unknown'),
                    'connprivkey': str(self.connprivkey)
                },
                'timestamp': int(time.time() * 1000)
            })
            logger.info(f"Broadcasted expect message: {getattr(self.msgtype, 'name', 'unknown')}")
        except Exception as e:
            logger.error(f"Error broadcasting expect message: {e}")
        return result

class WsDisconnect(Disconnect):
    def __repr__(self):
        return f"WsDisconnect(connprivkey={self.connprivkey})"

    def action(self, runner):
        result = super().action(runner)
        try:
            from flask_socketio import emit
            from api import socketio  # Import the socketio instance
            socketio.emit('message', {
                'sequence_id': 'disconnect_seq',
                'step': 4,
                'direction': 'out',
                'event': 'disconnect',
                'data': {'connprivkey': str(self.connprivkey)},
                'timestamp': int(time.time() * 1000)
            })
            logger.info(f"Broadcasted disconnect message")
        except Exception as e:
            logger.error(f"Error broadcasting disconnect message: {e}")
        return result

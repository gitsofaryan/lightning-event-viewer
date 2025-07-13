from lnprototest import Connect, ExpectMsg, RawMsg, Event
from flask_socketio import emit
import logging
import time

logger = logging.getLogger(__name__)

class MockConn:
    def __init__(self, privkey):
        self.privkey = privkey
        self.must_not_events = []  

class WsConnect(Connect):
    def action(self, runner=None) -> bool:
        super().action(runner)
        emit('connection', {'connprivkey': self.connprivkey, 'time': int(time.time() * 1000)})
        logger.info(f"Connected: {self.connprivkey}")
        return True

class WsExpectMsg(ExpectMsg):
    def find_conn(self, runner) -> "MockConn":
        return MockConn(self.connprivkey)

    def action(self, runner=None) -> bool:
        super().action(runner)
        data = {'message': self.msgtype.name, 'time': int(time.time() * 1000)}
        emit('received', data)
        logger.info(f"Expected: {data}")
        return True

class WsRawMsg(RawMsg):
    def find_conn(self, runner) -> "MockConn":
        return MockConn(self.connprivkey)

    def action(self, runner=None) -> bool:
        super().action(runner)
        data = {'message': self.message, 'time': int(time.time() * 1000)}
        emit('sent', data)
        logger.info(f"Sent: {data}")
        return True

class WsComplete(Event):
    def action(self, runner=None) -> bool:
        super().action(runner)
        emit('done', {'status': 'complete', 'time': int(time.time() * 1000)})
        logger.info("Sequence complete")
        return True
import sys
import os
import io
sys.path.append(os.getcwd())
import monkeypatch # Fix SSL/OpenSRE on Windows
from lnprototest.namespace import namespace

ns = namespace()

msgtype = ns.get_msgtype("init")
buf = io.BytesIO()
msgtype.write(buf, {"gflen": 0, "features": b""}, {})
print(f"Write output hex: {buf.getvalue().hex()}")
print(f"MsgType number: {msgtype.number}")








import eventlet
eventlet.monkey_patch()

import monkeypatch # MUST BE SECOND
from api import create_app
from extensions import socketio

app = create_app()

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, log_output=True)


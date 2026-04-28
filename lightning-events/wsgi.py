import eventlet
eventlet.monkey_patch()

import monkeypatch # MUST BE SECOND
from api import create_app
from extensions import socketio

app = create_app()

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("Lightning Event Viewer API running smoothly!")
    print("Listening at: http://127.0.0.1:5000")
    print("Logs will appear below for incoming requests...")
    print("Press Ctrl+C to stop the server")
    print("=" * 50 + "\n")

    
    # Run the server. Using debug=True and log_output=True ensures eventlet prints request logs.
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, log_output=True)

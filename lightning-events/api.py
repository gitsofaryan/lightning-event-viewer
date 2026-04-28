import eventlet
eventlet.monkey_patch()

import monkeypatch # MUST BE SECOND
from flask import Flask
from extensions import socketio, cors
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    cors.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='eventlet')

    from routes import sequence_bp
    app.register_blueprint(sequence_bp)

    @app.route('/')
    def index():
        return {"status": "ok", "message": "Lightning Event Viewer API is running"}, 200

    return app


if __name__ == "__main__":
    import os
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)

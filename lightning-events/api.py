import monkeypatch # MUST BE FIRST
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
    socketio.init_app(app, cors_allowed_origins="*")

    from routes import sequence_bp
    app.register_blueprint(sequence_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    socketio.run(app, debug=True)
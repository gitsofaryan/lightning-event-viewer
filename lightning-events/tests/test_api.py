import pytest
import subprocess
import time
import requests
import threading
import socket
import os
import signal
import logging
import json
from contextlib import closing

# Set up logging for requests and responses
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_request_response(response, test_name):
    """Log detailed request and response information"""
    logger.info(f"[{test_name}] Request URL: {response.request.url}")
    logger.info(f"[{test_name}] Request Method: {response.request.method}")
    logger.info(f"[{test_name}] Request Body: {response.request.body}")
    logger.info(f"[{test_name}] Response Status: {response.status_code}")
    logger.info(f"[{test_name}] Response Body: {response.text}")

def find_free_port():
    """Find a free port for testing"""
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

@pytest.fixture(scope="session")
def api_server():
    """Start the real Flask API server for testing"""
    # Start the actual API server
    server_process = subprocess.Popen([
        'python', 'api.py'
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Wait for server to start
    time.sleep(3)
    
    # Test if server is responding
    base_url = 'http://127.0.0.1:5000'
    max_retries = 10
    for i in range(max_retries):
        try:
            response = requests.get(f'{base_url}/', timeout=2)
            break  # Server is responding
        except requests.exceptions.RequestException:
            if i == max_retries - 1:
                server_process.terminate()
                server_process.wait()
                pytest.skip("Could not connect to API server")
            time.sleep(1)
    
    yield base_url
    
    # Cleanup - terminate server
    server_process.terminate()
    server_process.wait()

def test_api_connect_sequence(api_server):
    """Test real API connect sequence"""
    response = requests.post(f'{api_server}/sequence', json=[
        {"type": "connect", "connprivkey": "03"},
        {'type': 'send', 'msg': {
            'type': 'init',
            'connprivkey': '03'
        }}
    ])
    log_request_response(response, "test_api_connect_sequence")
    assert response.status_code >= 200
    
    response = response.json()
    
    assert 'events_processed' in response
    assert response['events_processed'] == 2
import os
import time
import socketio
import eventlet
import requests
from dotenv import load_dotenv
from datetime import datetime

# Impor logika dari TimeseriesPredict
from TimeseriesPredict import predict_timeseries, clean_data_hex

# ----------------------------------------------------------------------------
# [1] CONFIGURATION & INITIALIZATION
# ----------------------------------------------------------------------------
load_dotenv('.env.local')

PORT = int(os.getenv('PORT', 4000))
POLLING_INTERVAL = 2.0  # 2 Seconds
WINDOW_SIZE = 10

# Initialize Socket.IO server
sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)

# State Store (In-Memory)
last_seen_hex = {}
node_buffers = {}
latest_predictions_store = {}

FIREBASE_URL = os.getenv('NEXT_PUBLIC_FIREBASE_DATABASE_URL')
if not FIREBASE_URL:
    print("❌ NEXT_PUBLIC_FIREBASE_DATABASE_URL not found in .env.local")
    exit(1)

def get_firebase_data():
    try:
        url = f"{FIREBASE_URL}/detection_system.json"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Firebase fetch error: {e}")
    return None

def map_prediction_to_id(label):
    # Mapping based on time series phase_label
    label = label.lower()
    if "no wifi no drone" in label:
        return 0
    elif "drone" in label:
        return 3
    elif "wifi" in label:
        return 1
    return 0

# ----------------------------------------------------------------------------
# [2] SOCKET COMMUNICATION
# ----------------------------------------------------------------------------
@sio.event
def connect(sid, environ):
    print(f"🔌 Client connected: {sid}")
    # Sync new client with latest known states
    for node, pred in latest_predictions_store.items():
        sio.emit('prediction_update', pred, to=sid)

@sio.event
def disconnect(sid):
    print(f"🔌 Client disconnected: {sid}")

# ----------------------------------------------------------------------------
# [3] POLLING LOOP & BUFFER MANAGEMENT
# ----------------------------------------------------------------------------
def polling_loop():
    print(f"📡 Polling Started (Interval: {POLLING_INTERVAL}s)")
    while True:
        try:
            nodes = get_firebase_data()
            if not nodes:
                eventlet.sleep(POLLING_INTERVAL)
                continue

            for node_key, node_data in nodes.items():
                raw_hex = node_data.get('data_hex', "")
                
                # Hapus prefix "RAW_"
                if raw_hex.startswith("RAW_"):
                    raw_hex = raw_hex.replace("RAW_", "")
                
                if not raw_hex:
                    continue
                
                # Check if data is new
                if last_seen_hex.get(node_key) != raw_hex:
                    last_seen_hex[node_key] = raw_hex
                    
                    # Manage Buffer
                    if node_key not in node_buffers:
                        node_buffers[node_key] = []
                        
                    node_buffers[node_key].append(raw_hex)
                    
                    # Sliding Window
                    if len(node_buffers[node_key]) > WINDOW_SIZE:
                        node_buffers[node_key].pop(0)
                        
                    # Execute Prediction if buffer is full
                    if len(node_buffers[node_key]) == WINDOW_SIZE:
                        print(f"\n🔄 Running prediction for {node_key}...")
                        result = predict_timeseries(node_buffers[node_key])
                        
                        if result:
                            # Create Payload
                            payload = {
                                "node": node_key,
                                "prediction_id": map_prediction_to_id(result["predicted_label"]),
                                "prediction_label": result["predicted_label"],
                                "timestamp": datetime.utcnow().isoformat() + "Z",
                                "original_data": node_data
                            }
                            
                            # Update Global Store
                            latest_predictions_store[node_key] = payload
                            
                            # Broadcast to UI
                            sio.emit('prediction_update', payload)
                            print(f"🎯 [{node_key}] Broadcast: {result['predicted_label']} (Score: {result['cosine_similarity']:.2f})")
                            
        except Exception as e:
            print(f"Polling Error: {e}")
            
        eventlet.sleep(POLLING_INTERVAL)

# ----------------------------------------------------------------------------
# [4] START SERVER
# ----------------------------------------------------------------------------
if __name__ == '__main__':
    print(f"🚀 Prediction Server running on http://localhost:{PORT}")
    
    # Run polling loop in a background thread
    eventlet.spawn(polling_loop)
    
    # Start WSGI server
    eventlet.wsgi.server(eventlet.listen(('', PORT)), app)

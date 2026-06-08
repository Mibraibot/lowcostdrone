/**
 * ============================================================================
 * 🛰️ DRONE DETECTION REAL-TIME PREDICTION SERVER
 * ============================================================================
 * This server handles:
 * 1. 📡 Polling raw hex data from Firebase Realtime Database
 * 2. 🧠 Running ML Inference via ONNX (Drone Detector Model)
 * 3. 🔌 Broadcasting live predictions to Dashboard via Socket.io
 * ============================================================================
 */

require('dotenv').config({ path: '.env.local' });
const ort = require('onnxruntime-node');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const http = require('http');
const { Server } = require('socket.io');

// ----------------------------------------------------------------------------
// [1] CONFIGURATION & INITIALIZATION
// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 4000;
const POLLING_INTERVAL = 2000; // 2 Seconds
const MODEL_PATH = './drone_detector_model.onnx';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const server = http.createServer();
const io = new Server(server, {
    cors: { origin: "*" } // Allow Dashboard to connect
});

// State Store (In-Memory)
const lastHexMap = {};
const latestPredictionsStore = {};

// ----------------------------------------------------------------------------
// [2] MACHINE LEARNING INFERENCE ENGINE (ML Backend)
// ----------------------------------------------------------------------------
let ortSession;

async function initModel() {
    try {
        console.log('🧠 Loading ONNX Model...');
        ortSession = await ort.InferenceSession.create(MODEL_PATH);
        console.log('✅ Model Loaded Successfully');
    } catch (e) {
        console.error('❌ Failed to load model:', e);
        process.exit(1);
    }
}

/**
 * Perform inference on raw hex data
 * @param {string} hexStr Raw data from sensor
 * @returns {Promise<{id: number, label: string}>}
 */
async function performInference(hexStr) {
    try {
        // Preprocessing: Hex to Integer Array
        let newData = [];
        for (let i = 0; i < hexStr.length; i += 2) {
            newData.push(parseInt(hexStr.substr(i, 2), 16));
        }

        // Feature Engineering: Padding/Trimming to 63 features
        const expectedFeatures = 63; 
        if (newData.length < expectedFeatures) {
            newData = newData.concat(new Array(expectedFeatures - newData.length).fill(0));
        } else if (newData.length > expectedFeatures) {
            newData = newData.slice(0, expectedFeatures);
        }

        // Tensor Creation
        const floatData = new Float32Array(newData);
        const tensor = new ort.Tensor('float32', floatData, [1, expectedFeatures]);

        // Run ML Model
        const results = await ortSession.run({ float_input: tensor }, ['output_label']);
        const prediction = Number(results.output_label.data[0]);

        // Label Mapping
        const mapping = {
            0: { id: 1, label: "WIFI ONLY" },
            1: { id: 2, label: "WIFI+BT" },
            2: { id: 3, label: "DRONE DETECTED" }
        };
        
        return mapping[prediction] || { id: 0, label: "Unknown" };
    } catch (e) {
        console.error('Inference Error:', e);
        return { id: -1, label: "Processing Error" };
    }
}

// ----------------------------------------------------------------------------
// [3] SOCKET & FIREBASE COMMUNICATION (Communication Backend)
// ----------------------------------------------------------------------------

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Sync new client with latest known states
    Object.values(latestPredictionsStore).forEach(pred => {
        socket.emit('prediction_update', pred);
    });

    socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`));
});

async function runPollingLoop() {
    const detectionRef = ref(db, 'detection_system');
    
    console.log(`📡 Polling Started (Interval: ${POLLING_INTERVAL}ms)`);

    setInterval(async () => {
        try {
            const snapshot = await get(detectionRef);
            const nodes = snapshot.val();
            if (!nodes) return;

            for (const [nodeKey, nodeData] of Object.entries(nodes)) {
                let hex = String(nodeData.data_hex || "");
                
                // Hapus prefix "RAW_" agar model ML hanya membaca angkanya
                if (hex.startsWith("RAW_")) {
                    hex = hex.replace("RAW_", "");
                }

                if (!hex) continue;

                // Check if data is new
                if (lastHexMap[nodeKey] !== hex) {
                    lastHexMap[nodeKey] = hex;

                    // Execute Prediction
                    const prediction = await performInference(hex);
                    
                    // Create Payload
                    const payload = {
                        node: nodeKey,
                        prediction_id: prediction.id,
                        prediction_label: prediction.label,
                        timestamp: new Date().toISOString(),
                        original_data: nodeData
                    };

                    // Update Global Store
                    latestPredictionsStore[nodeKey] = payload;

                    // Broadcast to UI
                    io.emit('prediction_update', payload);

                    console.log(`🎯 [${nodeKey}] Prediction: ${prediction.label} | Hex: ${hex.substring(0, 20)}...`);
                }
            }
        } catch (e) {
            console.error('Polling Error:', e);
        }
    }, POLLING_INTERVAL);
}

// ----------------------------------------------------------------------------
// [4] START SERVER
// ----------------------------------------------------------------------------
(async () => {
    await initModel();
    server.listen(PORT, () => {
        console.log(`🚀 Prediction Server running on http://localhost:${PORT}`);
        runPollingLoop();
    });
})();

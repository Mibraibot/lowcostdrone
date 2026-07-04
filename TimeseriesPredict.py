import re
import numpy as np
import pandas as pd
import os

# ============================================================
# 1. PARAMETER DASAR
# ============================================================

EXPECTED_CHANNEL_COUNT = 125
ACTIVE_THRESHOLD = 0
HIGH_CONFIDENCE_THRESHOLD = 0.85
MEDIUM_CONFIDENCE_THRESHOLD = 0.65

# ============================================================
# 2. DATA BARU (DARI CONTOH KOLAB)
# ============================================================

TEST_DATA_HEX_LIST = [
    "00000000000000000101010000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000011100000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000001110011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000011100000111110000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000100000000000000110000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00111000001111111111110000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000100101111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00010011111101000111111110010100101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00100110001000000010010000000001000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000",
    "00111110000100100000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000011011000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000",
    "00000000010000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000001000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000",
    "00000000000001010111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00111111111101110000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000000011100000000000101010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "00000000000000001011000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
]

PERSISTENCE_WINDOW = len(TEST_DATA_HEX_LIST)

# ============================================================
# 3. FUNGSI DASAR
# ============================================================

def clean_data_hex(raw_hex, expected_len=EXPECTED_CHANNEL_COUNT):
    if raw_hex is None:
        return None

    raw_hex = str(raw_hex).strip().upper()

    if raw_hex == "":
        return None

    if raw_hex.startswith("0X"):
        raw_hex = raw_hex[2:]

    cleaned_hex = re.sub(r"[^0-9A-F]", "", raw_hex)

    if cleaned_hex == "":
        return None

    if len(cleaned_hex) < expected_len:
        cleaned_hex = cleaned_hex.ljust(expected_len, "0")
    elif len(cleaned_hex) > expected_len:
        cleaned_hex = cleaned_hex[:expected_len]

    return cleaned_hex


def hex_to_channel_value(hex_str):
    return np.array([int(char, 16) for char in hex_str], dtype=float)


def channel_value_to_binary_occupancy(channel_values):
    return (np.array(channel_values, dtype=float) > ACTIVE_THRESHOLD).astype(int)


def max_consecutive_active_binary(binary_values):
    max_run = 0
    current_run = 0

    for value in binary_values:
        if value == 1:
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 0

    return max_run


def compute_window_persistence(binary_window):
    binary_window = np.array(binary_window).astype(int)

    n_time, n_channel = binary_window.shape
    persistence_vector = np.zeros(n_channel, dtype=float)

    for ch in range(n_channel):
        persistence_vector[ch] = max_consecutive_active_binary(binary_window[:, ch])

    return persistence_vector


def normalize_vector(v):
    v = np.array(v, dtype=float)
    max_val = v.max()

    if max_val == 0:
        return v

    return v / max_val


def cosine_similarity(a, b):
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)

    denominator = np.linalg.norm(a) * np.linalg.norm(b)

    if denominator == 0:
        return 0.0

    return float(np.dot(a, b) / denominator)


def jaccard_similarity_binary(a, b):
    a = np.array(a) > 0
    b = np.array(b) > 0

    intersection = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()

    if union == 0:
        return 1.0

    return float(intersection / union)


def hamming_distance_binary(a, b):
    a = (np.array(a) > 0).astype(int)
    b = (np.array(b) > 0).astype(int)

    return float(np.mean(a != b))


def confidence_label(score):
    if score >= HIGH_CONFIDENCE_THRESHOLD:
        return "High"
    elif score >= MEDIUM_CONFIDENCE_THRESHOLD:
        return "Medium"
    else:
        return "Low"

def predict_timeseries(test_data_hex_list):
    # ============================================================
    # 4. LOAD FINGERPRINT REFERENSI
    # ============================================================
    
    reference_filename = "relative_channel_persistence_8conditions.csv"
    if not os.path.exists(reference_filename):
        print(f"Error: {reference_filename} not found.")
        return

    df_reference = pd.read_csv(reference_filename)
    relative_cols = [f"relative_persistence_ch_{i}" for i in range(EXPECTED_CHANNEL_COUNT)]

    reference_vectors = []
    for _, row in df_reference.iterrows():
        reference_vectors.append({
            "scenario_name": row["scenario_name"],
            "phase_label": row["phase_label"],
            "vector": row[relative_cols].astype(float).values
        })

    # ============================================================
    # 5. KONVERSI TEST_DATA_HEX_LIST MENJADI BINARY WINDOW
    # ============================================================

    binary_rows = []

    for idx, raw_hex in enumerate(test_data_hex_list):
        cleaned_hex = clean_data_hex(raw_hex)
        if cleaned_hex is None:
            continue

        channel_values = hex_to_channel_value(cleaned_hex)
        binary_values = channel_value_to_binary_occupancy(channel_values)
        binary_rows.append(binary_values)

    if len(binary_rows) == 0:
        print("Error: No valid data to process.")
        return

    binary_matrix = np.array(binary_rows, dtype=int)

    # ============================================================
    # 6. HITUNG WINDOW PERSISTENCE DAN RELATIVE PERSISTENCE
    # ============================================================

    test_persistence = compute_window_persistence(binary_matrix)
    test_relative = normalize_vector(test_persistence)
    total_persistence = float(test_persistence.sum())

    # ============================================================
    # 7. FINGERPRINT MATCHING
    # ============================================================

    if total_persistence == 0:
        predicted_scenario = "NO_WIFI_NO_DRONE"
        predicted_label = "No WiFi No Drone"
        best_cosine = 1.0
        best_jaccard = 1.0
        best_hamming = 0.0
        confidence = "High"

    else:
        score_rows = []
        for ref in reference_vectors:
            ref_scenario = ref["scenario_name"]
            ref_label = ref["phase_label"]
            ref_vector = ref["vector"]

            if ref_scenario == "NO_WIFI_NO_DRONE":
                continue

            cos_score = cosine_similarity(test_relative, ref_vector)
            jac_score = jaccard_similarity_binary(test_relative, ref_vector)
            ham_score = hamming_distance_binary(test_relative, ref_vector)

            score_rows.append({
                "scenario_name": ref_scenario,
                "phase_label": ref_label,
                "cosine_similarity": cos_score,
                "jaccard_similarity": jac_score,
                "hamming_distance": ham_score
            })

        df_score = pd.DataFrame(score_rows)
        df_score = df_score.sort_values("cosine_similarity", ascending=False).reset_index(drop=True)
        df_score["confidence"] = df_score["cosine_similarity"].apply(confidence_label)

        best = df_score.iloc[0]

        predicted_scenario = best["scenario_name"]
        predicted_label = best["phase_label"]
        best_cosine = float(best["cosine_similarity"])
        best_jaccard = float(best["jaccard_similarity"])
        best_hamming = float(best["hamming_distance"])
        confidence = best["confidence"]

    # ============================================================
    # 8. TAMPILKAN HASIL PREDIKSI (Sesuai Permintaan)
    # ============================================================
    print("============================================================")
    print("HASIL PREDIKSI WINDOW")
    print("============================================================")
    print(f"Predicted scenario : {predicted_scenario}")
    print(f"Predicted label    : {predicted_label}")
    print(f"Cosine similarity  : {best_cosine:.6f}")
    print(f"Jaccard similarity : {best_jaccard:.6f}")
    print(f"Hamming distance   : {best_hamming:.6f}")
    print(f"Confidence         : {confidence}")
    
    return {
        "predicted_scenario": predicted_scenario,
        "predicted_label": predicted_label,
        "cosine_similarity": best_cosine,
        "jaccard_similarity": best_jaccard,
        "hamming_distance": best_hamming,
        "confidence": confidence
    }

if __name__ == "__main__":
    predict_timeseries(TEST_DATA_HEX_LIST)

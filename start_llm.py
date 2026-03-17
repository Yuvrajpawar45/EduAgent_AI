import subprocess
import requests
import time
import sys
import os

# ---- CONFIGURATION ----
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "phi3:mini"


def is_ollama_running() -> bool:
    """
    Ping Ollama's API endpoint to see if it's running.
    Returns True if running, False if not.

    Why requests.get? Ollama runs as a local web server.
    We check it the same way a browser checks a website.
    """
    try:
        response = requests.get(
            f"{OLLAMA_BASE_URL}/api/tags",
            timeout=3
        )
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        return False
    except requests.exceptions.Timeout:
        return False
    except Exception:
        return False


def is_model_available() -> bool:
    """
    Check if phi3:mini is already downloaded on this machine.
    Returns True if available, False if not.
    """
    try:
        response = requests.get(
            f"{OLLAMA_BASE_URL}/api/tags",
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            models = data.get("models", [])
            # Each model has a "name" field like "phi3:mini"
            available = [m.get("name", "") for m in models]
            return any(MODEL_NAME in name for name in available)
        return False
    except Exception:
        return False


def start_ollama() -> bool:
    """
    Start the Ollama server as a background process.
    Works on Windows, Mac, and Linux.
    Returns True if Ollama started successfully.

    Why subprocess.Popen?
    Popen starts a program in the background without waiting for it to finish.
    This lets our Python script continue running while Ollama starts up.
    """
    print("🔄 Ollama is not running. Attempting to start it automatically...")

    try:
        if sys.platform == "win32":
            # Windows: CREATE_NO_WINDOW prevents a terminal window from popping up
            subprocess.Popen(
                ["ollama", "serve"],
                creationflags=subprocess.CREATE_NO_WINDOW,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        else:
            # Mac / Linux
            subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

        # Wait up to 20 seconds for Ollama to finish starting
        print("⏳ Waiting for Ollama server to be ready", end="", flush=True)
        for _ in range(20):
            time.sleep(1)
            print(".", end="", flush=True)
            if is_ollama_running():
                print("\n✅ Ollama started successfully!")
                return True

        print("\n❌ Ollama did not start in time. Try running 'ollama serve' manually.")
        return False

    except FileNotFoundError:
        print("\n❌ 'ollama' command not found on this system.")
        print("   Please install Ollama from: https://ollama.com/download")
        return False

    except Exception as e:
        print(f"\n❌ Unexpected error while starting Ollama: {e}")
        return False


def ensure_model_downloaded():
    """
    If phi3:mini is not downloaded yet, pull it automatically.
    This only runs once — after download it's stored locally.
    Note: First download can take 2–10 minutes depending on internet speed.
    """
    if not is_model_available():
        print(f"\n📥 '{MODEL_NAME}' model not found locally.")
        print("   Downloading now... This may take several minutes on first run.")
        print("   (This only happens once — future runs will be instant)\n")

        try:
            # Run 'ollama pull phi3:mini' — shows download progress in terminal
            result = subprocess.run(
                ["ollama", "pull", MODEL_NAME],
                text=True
                # Not using capture_output=True so progress shows in terminal
            )
            if result.returncode == 0:
                print(f"\n✅ '{MODEL_NAME}' downloaded and ready!")
            else:
                print(f"\n❌ Failed to download '{MODEL_NAME}'. Check your internet connection.")

        except Exception as e:
            print(f"❌ Error during model download: {e}")
    else:
        print(f"✅ '{MODEL_NAME}' is already downloaded")


def test_llm_response() -> bool:
    """
    Send a tiny test prompt to phi3:mini to confirm it's responding.
    Returns True if the model replies correctly.

    Why test? Sometimes Ollama starts but the model takes a moment
    to load into memory. This confirms everything is fully ready.
    """
    print("🧪 Testing LLM response with a quick message...")
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": MODEL_NAME,
                "prompt": "Reply with the single word: READY",
                "stream": False,
                "options": {
                    "num_predict": 5   # Only generate 5 tokens — keeps test fast
                }
            },
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            reply = result.get("response", "").strip()
            print(f"✅ LLM test passed! Model replied: '{reply}'")
            return True
        else:
            print(f"❌ LLM test failed. HTTP status: {response.status_code}")
            return False

    except requests.exceptions.Timeout:
        print("❌ LLM test timed out. Model may be slow to load on first use.")
        return False
    except Exception as e:
        print(f"❌ LLM test error: {e}")
        return False


def initialize_llm() -> dict:
    """
    MAIN FUNCTION — called by app.py on startup.

    Runs the complete initialization sequence:
      Step 1 → Check if Ollama is running, start if not
      Step 2 → Check if phi3:mini is downloaded, download if not
      Step 3 → Test the LLM responds correctly
      Step 4 → Return status dict for the UI to display

    Returns a dictionary like:
    {
        "ready": True/False,
        "ollama_running": True/False,
        "model_available": True/False,
        "llm_responding": True/False,
        "message": "Status message for the UI"
    }
    """
    print("\n" + "=" * 55)
    print("  🚀 EduAgent AI — Local LLM Initialization")
    print("=" * 55)

    status = {
        "ollama_running": False,
        "model_available": False,
        "llm_responding": False,
        "ready": False,
        "message": ""
    }

    # ---- STEP 1: Check / Start Ollama ----
    print("\n[1/3] Checking Ollama server...")
    if is_ollama_running():
        print("✅ Ollama is already running")
        status["ollama_running"] = True
    else:
        status["ollama_running"] = start_ollama()

    if not status["ollama_running"]:
        status["message"] = (
            "Cannot start Ollama. "
            "Please install it from https://ollama.com/download "
            "then run 'ollama serve' in a terminal."
        )
        print("\n" + "=" * 55 + "\n")
        return status

    # ---- STEP 2: Check / Download Model ----
    print("\n[2/3] Checking phi3:mini model...")
    ensure_model_downloaded()
    status["model_available"] = is_model_available()

    if not status["model_available"]:
        status["message"] = (
            f"'{MODEL_NAME}' model not available. "
            "Run 'ollama pull phi3:mini' in a terminal."
        )
        print("\n" + "=" * 55 + "\n")
        return status

    # ---- STEP 3: Test LLM Response ----
    print("\n[3/3] Testing LLM response...")
    status["llm_responding"] = test_llm_response()

    # ---- Final Status ----
    if status["llm_responding"]:
        status["ready"] = True
        status["message"] = f"'{MODEL_NAME}' is ready! Running locally on your machine."
        print(f"\n🎉 All checks passed! EduAgent AI is ready.")
    else:
        status["message"] = (
            "Ollama is running but LLM is not responding. "
            "Try restarting Ollama: close it and run 'ollama serve' again."
        )
        print("\n⚠️ LLM not responding correctly.")

    print("=" * 55 + "\n")
    return status


# ============================================================
# Run directly for manual testing:
#   python start_llm.py
# ============================================================
if __name__ == "__main__":
    result = initialize_llm()
    print("\n--- Final Status ---")
    for key, value in result.items():
        print(f"  {key}: {value}")
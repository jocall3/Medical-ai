from fastapi import FastAPI

app = FastAPI()

@app.get("/status")
def get_status():
    return {"status": "operational", "devices_connected": 42}
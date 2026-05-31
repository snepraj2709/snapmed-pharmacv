from fastapi import FastAPI


app = FastAPI(title="SnapMed PharmaCV API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

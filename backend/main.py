from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes, simulation
from api.v1_routes import v1_router

app = FastAPI(title="ClimateRoute Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)
app.include_router(simulation.router)
app.include_router(v1_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

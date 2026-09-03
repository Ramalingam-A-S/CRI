# WEBSOCKET REAL-TIME EVENTS CONTRACT

The real-time streaming event architecture is based on WebSocket connections at `ws://localhost:8000/ws`.

## Event Types

### 1. `sensor.updated`
Emitted when an IoT station transmits new telemetry.
```json
{
  "event": "sensor.updated",
  "data": {
    "id": "sens-001",
    "telemetry": {
      "temperature": 28.4,
      "rainfall": 45.2,
      "waterLevel": 68.5,
      "timestamp": "2026-09-03T18:30:00Z"
    }
  }
}
```

### 2. `sensor.anomaly`
Emitted when an environmental anomaly is detected.
```json
{
  "event": "sensor.anomaly",
  "data": {
    "sensorId": "sens-002",
    "anomalyType": "RAPID_WATER_INCREASE",
    "description": "Water level spiked +45cm in past 20 minutes"
  }
}
```

### 3. `risk.updated`
Emitted when the Risk Fusion Engine completes a new spatial evaluation.

### 4. `alert.created` / `alert.updated`
Emitted when new critical warnings are generated or acknowledged.

### 5. `system.modeChanged`
Emitted when system mode switches (`CLOUD` <-> `LOCAL_EDGE` <-> `DEGRADED` <-> `NO_DATA`).

### 6. `simulation.updated` / `simulation.completed`
Emitted during active disaster simulation progression steps.

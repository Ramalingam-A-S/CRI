"""
backend/tests/test_phase2_backend.py - Comprehensive Backend Verification Matrix (Items A-W)
"""
import unittest
from fastapi.testclient import TestClient
from main import app
from ml.hazard_models import (
    predict_flood,
    predict_heat,
    predict_landslide,
    predict_storm,
    risk_fusion,
    OperatingMode
)
from core.weather_predictor import WeatherPredictor
from core.sensor_store import SensorStore
from core.hotspot_store import HotspotStore
from core.alert_engine import AlertEngine
from core.spatial_risk_engine import SpatialRiskEngine

from core.db import get_db_connection

class TestPhase2Backend(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        self.spatial_engine = SpatialRiskEngine.get_instance()
        self.spatial_engine.reset_simulation()
        self.spatial_engine.set_operating_mode("CLOUD")
        conn = get_db_connection()
        conn.execute("DELETE FROM hotspots")
        conn.execute("DELETE FROM sensors")
        conn.commit()
        conn.close()

    # A & B. Backend startup & Health Endpoint
    def test_A_B_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    # C. Weather Inference
    def test_C_weather_inference(self):
        wp = WeatherPredictor.get_instance()
        pred = wp.predict(features={"temperature": 25.0, "rainfall": 10.0, "humidity": 60.0})
        self.assertIn("temperature", pred)
        self.assertIn("rainfall", pred)
        self.assertIn("humidity", pred)

    # D. Flood Inference
    def test_D_flood_inference(self):
        weather = {"rainfall": 80.0, "temperature": 28.0}
        geo = {"elevation": 4.0, "slope": 1.0, "water_proximity": 100.0}
        res = predict_flood(weather, geo, OperatingMode.CLOUD)
        self.assertIn("riskScore", res)
        self.assertIn("severity", res)
        self.assertIn("confidence", res)
        self.assertTrue(0.0 <= res["riskScore"] <= 100.0)

    # E. Heatwave Inference
    def test_E_heatwave_inference(self):
        weather = {"temperature": 44.0, "humidity": 85.0}
        geo = {"elevation": 10.0}
        res = predict_heat(weather, geo, OperatingMode.CLOUD)
        self.assertIn("riskScore", res)
        self.assertTrue(0.0 <= res["riskScore"] <= 100.0)

    # F. Landslide Inference
    def test_F_landslide_inference(self):
        weather = {"rainfall": 120.0}
        geo = {"slope": 35.0, "elevation": 120.0}
        res = predict_landslide(weather, geo, OperatingMode.CLOUD)
        self.assertIn("riskScore", res)
        self.assertTrue(0.0 <= res["riskScore"] <= 100.0)

    # G. Storm Inference
    def test_G_storm_inference(self):
        weather = {"windSpeed": 110.0, "pressure": 955.0}
        geo = {"elevation": 2.0}
        res = predict_storm(weather, geo, OperatingMode.CLOUD)
        self.assertIn("riskScore", res)
        self.assertTrue(0.0 <= res["riskScore"] <= 100.0)

    # H. Risk Fusion
    def test_H_risk_fusion(self):
        hazards = {
            "FLOOD": {"riskScore": 85.0, "confidence": 0.50},
            "HEAT": {"riskScore": 30.0, "confidence": 0.50}
        }
        fused = risk_fusion(hazards, sensor_quality=0.90)
        self.assertIn("overallScore", fused)
        self.assertIn("overallSeverity", fused)
        self.assertIn("overallConfidence", fused)

    # I & J. RiskScore (0-100) & Confidence (0-1) Bounds
    def test_I_J_bounds(self):
        assessment = self.spatial_engine.evaluate_risk()
        self.assertTrue(0.0 <= assessment["riskScore"] <= 100.0)
        self.assertTrue(0.0 <= assessment["confidence"] <= 1.0)

    # K. riskScore and confidence Independence
    def test_K_score_confidence_independence(self):
        assessment = self.spatial_engine.evaluate_risk(mode="CLOUD")
        self.assertNotEqual(assessment["riskScore"], assessment["confidence"])
        self.assertTrue(0.0 < assessment["confidence"] <= 0.50)

    # L. Simulation Changes Risk Assessment
    def test_L_simulation_propagation(self):
        # Reset to baseline dry conditions
        self.client.post("/api/simulate", json={"rainfall_mm_h": 0.0, "temperature_c": 25.0})
        base_res = self.client.get("/api/v1/risk/assessment").json()

        # Trigger heavy rainfall simulation (200mm/h)
        sim_res = self.client.post("/api/simulate", json={
            "rainfall_mm_h": 200.0,
            "temperature_c": 32.0,
            "mode": "CLOUD"
        }).json()

        self.assertEqual(sim_res["status"], "SIMULATED")
        new_assessment = sim_res["riskAssessment"]
        self.assertGreater(new_assessment["riskScore"], base_res["riskScore"])

        # Reset simulation
        reset_res = self.client.post("/api/reset-simulation").json()
        self.assertEqual(reset_res["status"], "RESET")

    # M & N & O. Sensors Ingestion, Anomalies & Quality Penalties
    def test_M_N_O_sensors_ingestion_anomalies(self):
        # Create a test sensor first in the zero-state database
        self.client.post("/api/v1/sensors", json={
            "name": "Test Monitoring Node",
            "lat": 13.3860,
            "lng": 79.7980
        })
        sensors = self.client.get("/api/v1/sensors").json()
        self.assertTrue(len(sensors) > 0)

        # Ingest invalid reading (anomalous temperature 180°C)
        ingest_res = self.client.post("/api/v1/sensors/ingest", json={
            "sensor_id": sensors[0]["id"],
            "readings": {"temperature": 180.0, "humidity": 50.0}
        }).json()

        self.assertEqual(ingest_res["status"], "ingested")
        sns = ingest_res["sensor"]
        self.assertEqual(sns["anomaly"], "ANOMALOUS")
        self.assertTrue(len(sns["anomalies"]) > 0)
        self.assertLess(sns["qualityScore"], 1.0)

    # P. Admin Hotspots CRUD
    def test_P_hotspots_crud(self):
        create_res = self.client.post("/api/v1/hotspots", json={
            "name": "Test Hazardous Quarry",
            "latitude": 12.9100,
            "longitude": 80.1200,
            "hazard": "LANDSLIDE",
            "severity": "CRITICAL",
            "baselineRiskScore": 88
        })
        self.assertEqual(create_res.status_code, 201)
        hs = create_res.json()
        hs_id = hs["id"]

        all_hs = self.client.get("/api/v1/hotspots").json()
        self.assertTrue(any(h["id"] == hs_id for h in all_hs))

        upd_res = self.client.put(f"/api/v1/hotspots/{hs_id}", json={"baselineRiskScore": 95})
        self.assertEqual(upd_res.status_code, 200)
        self.assertEqual(upd_res.json()["baselineRiskScore"], 95)

        del_res = self.client.delete(f"/api/v1/hotspots/{hs_id}")
        self.assertEqual(del_res.status_code, 200)

    # Q. Alert Generation on Genuine Risk Transition
    def test_Q_alert_generation(self):
        self.client.post("/api/simulate", json={"rainfall_mm_h": 220.0})
        alerts = self.client.get("/api/v1/alerts").json()
        self.assertTrue(len(alerts) > 0)
        self.assertIn(alerts[0]["severity"], ["HIGH", "CRITICAL"])

    # R, S, T. CLOUD, LOCAL_EDGE, DEGRADED Operating Modes
    def test_R_S_T_operating_modes(self):
        cloud_res = self.spatial_engine.evaluate_risk(mode="CLOUD")
        self.assertEqual(cloud_res["mode"], "CLOUD")

        edge_res = self.spatial_engine.evaluate_risk(mode="LOCAL_EDGE")
        self.assertEqual(edge_res["mode"], "LOCAL_EDGE")
        self.assertLess(edge_res["confidence"], cloud_res["confidence"])

        degraded_res = self.spatial_engine.evaluate_risk(mode="DEGRADED")
        self.assertEqual(degraded_res["mode"], "DEGRADED")
        self.assertLess(degraded_res["confidence"], edge_res["confidence"])

    # U. NO_DATA Mode - Does NOT Fabricate Predictions
    def test_U_no_data_mode(self):
        valid = self.spatial_engine.evaluate_risk(mode="CLOUD")

        no_data_res = self.spatial_engine.evaluate_risk(mode="NO_DATA")
        self.assertEqual(no_data_res["mode"], "NO_DATA")
        self.assertEqual(no_data_res["confidence"], 0.0)
        self.assertEqual(no_data_res["status"], "NO_DATA")
        self.assertIn("message", no_data_res)

    # V. Current vs Predicted Areas Separation
    def test_V_current_vs_predicted_areas(self):
        # Create sample user hotspot in the dynamic store
        hs = HotspotStore.get_instance().create_hotspot({
            "name": "Sadasiva Ridge Hotspot",
            "latitude": 13.3860,
            "longitude": 79.7980,
            "hazard": "FLOOD"
        })
        res = self.spatial_engine.evaluate_risk(mode="CLOUD")
        current = res.get("currentAreas", [])
        predicted = res.get("predictedAreas", [])

        self.assertTrue(len(current) > 0)
        self.assertTrue(len(predicted) > 0)
        self.assertFalse(all(c["isPredicted"] for c in current))
        self.assertTrue(all(p["isPredicted"] for p in predicted))

    # W. API Response Schema Consistency
    def test_W_schema_consistency(self):
        res = self.client.get("/api/v1/risk/assessment").json()
        required_keys = ["mode", "timestamp", "hazard", "severity", "riskScore", "confidence", "currentAreas", "predictedAreas"]
        for key in required_keys:
            self.assertIn(key, res)

    # X. Directional Propagation Prediction (Task 7)
    def test_X_directional_propagation_prediction(self):
        s_res = self.client.post("/api/sensors", json={
            "name": "Central Nagalapuram Sensor",
            "lat": 13.3860,
            "lng": 79.7980
        }).json()
        s_id = s_res["id"]

        # Hotspot 1: Landslide to the west on ridge
        self.client.post("/api/hotspots", json={
            "name": "Western Ridge Landslide Zone",
            "latitude": 13.3860,
            "longitude": 79.7500,
            "hazardTag": "landslide"
        })

        # Hotspot 2: Flood to the east on lowland plain
        self.client.post("/api/hotspots", json={
            "name": "Eastern Lowland Flood Basin",
            "latitude": 13.3860,
            "longitude": 79.8400,
            "hazardTag": "flood"
        })

        # Wind blowing from East (90 deg) toward West (270 deg) -> points at western ridge!
        sim_res = self.client.post("/api/simulate/run", json={
            "eventType": "heavy_rain",
            "sensorId": s_id,
            "dataPoints": {
                "rainfallMmHr": 75.0,
                "windSpeedKmh": 45.0,
                "windDirectionDeg": 90.0
            },
            "mode": "CLOUD"
        })
        self.assertEqual(sim_res.status_code, 200)
        data = sim_res.json()
        self.assertEqual(data["status"], "SUCCESS")
        ranked = data["rankedCandidates"]
        self.assertTrue(len(ranked) > 0)
        top = ranked[0]
        self.assertEqual(top["hazardTag"], "landslide")
        self.assertGreater(top["probability"], 50.0)
        self.assertTrue(len(top["factors"]) > 0)

if __name__ == "__main__":
    unittest.main()


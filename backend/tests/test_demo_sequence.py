"""
backend/tests/test_demo_sequence.py - Automated End-to-End API Demo Sequence Test
"""
import unittest
from fastapi.testclient import TestClient
from main import app

class TestDemoSequence(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)
        # Reset simulation back to baseline before test
        self.client.post("/api/reset-simulation")

    def test_full_demo_sequence(self):
        print("\n" + "=" * 70)
        print("STARTING C.R.I. BACKEND DEMO SEQUENCE VERIFICATION")
        print("=" * 70)

        # 1. Request normal risk assessment
        print("\n[STEP 1] Requesting Baseline Risk Assessment...")
        step1_res = self.client.get("/api/v1/risk/assessment").json()
        print(f"  -> Baseline Hazard: {step1_res['hazard']}, Severity: {step1_res['severity']}, Score: {step1_res['riskScore']}, Confidence: {step1_res['confidence']}")
        self.assertEqual(step1_res["mode"], "CLOUD")

        # 2 & 3. Run simulation with increased rainfall and receive changed hazard/risk output
        print("\n[STEP 2 & 3] Running Simulation: Heavy Rainfall (+160 mm/h)...")
        step2_res = self.client.post("/api/simulate", json={
            "rainfall_mm_h": 160.0,
            "temperature_c": 30.0,
            "mode": "CLOUD"
        }).json()
        sim_assessment = step2_res["riskAssessment"]
        print(f"  -> Simulated Hazard: {sim_assessment['hazard']}, Severity: {sim_assessment['severity']}, Score: {sim_assessment['riskScore']}")
        self.assertGreater(sim_assessment["riskScore"], step1_res["riskScore"])

        # 4. Retrieve affected areas
        print("\n[STEP 4] Retrieving Current and Predicted Affected Areas...")
        current_areas = sim_assessment["currentAreas"]
        predicted_areas = sim_assessment["predictedAreas"]
        print(f"  -> Current Affected Areas: {len(current_areas)} zones ({current_areas[0]['name']})")
        print(f"  -> Predicted Affected Areas: {len(predicted_areas)} zones ({predicted_areas[0]['name']})")
        self.assertTrue(len(current_areas) > 0)
        self.assertTrue(len(predicted_areas) > 0)

        # 5. Retrieve generated alert
        print("\n[STEP 5] Checking Dynamic Alerts Generated...")
        alerts = self.client.get("/api/v1/alerts").json()
        print(f"  -> Active Alerts Count: {len(alerts)}")
        self.assertTrue(len(alerts) > 0)
        print(f"  -> Top Alert: {alerts[0]['hazard']} {alerts[0]['severity']} - {alerts[0]['reason']}")

        # 6. Inspect sensors
        print("\n[STEP 6] Inspecting Sensor Network Telemetry...")
        sensors = self.client.get("/api/v1/sensors").json()
        print(f"  -> Total Sensors: {len(sensors)}")
        print(f"  -> Node 1 ({sensors[0]['name']}): Status={sensors[0]['status']}, QualityScore={sensors[0]['qualityScore']}")
        self.assertTrue(len(sensors) > 0)

        # 7 & 8. Switch to LOCAL_EDGE and continue inference from local/simulated data
        print("\n[STEP 7 & 8] Switching Mode to LOCAL_EDGE...")
        edge_res = self.client.get("/api/v1/risk/assessment?mode=LOCAL_EDGE").json()
        print(f"  -> LOCAL_EDGE Assessment: Mode={edge_res['mode']}, Severity={edge_res['severity']}, Score={edge_res['riskScore']}, Confidence={edge_res['confidence']}")
        self.assertEqual(edge_res["mode"], "LOCAL_EDGE")
        self.assertLess(edge_res["confidence"], sim_assessment["confidence"])

        # 9 & 10. Switch to NO_DATA and verify no new prediction is fabricated
        print("\n[STEP 9 & 10] Switching Mode to NO_DATA...")
        nodata_res = self.client.get("/api/v1/risk/assessment?mode=NO_DATA").json()
        print(f"  -> NO_DATA Assessment: Mode={nodata_res['mode']}, Status={nodata_res.get('status')}, Confidence={nodata_res['confidence']}")
        self.assertEqual(nodata_res["mode"], "NO_DATA")
        self.assertEqual(nodata_res["confidence"], 0.0)
        self.assertIn("message", nodata_res)

        # 11. Restore CLOUD mode
        print("\n[STEP 11] Restoring Mode to CLOUD...")
        restore_res = self.client.get("/api/v1/risk/assessment?mode=CLOUD").json()
        print(f"  -> Restored Mode: {restore_res['mode']}, Score={restore_res['riskScore']}, Confidence={restore_res['confidence']}")
        self.assertEqual(restore_res["mode"], "CLOUD")
        self.assertGreater(restore_res["confidence"], 0.0)

        print("\n" + "=" * 70)
        print(">>> SUCCESS: COMPLETE 11-STEP DEMO SEQUENCE PASSED <<<")
        print("=" * 70)

if __name__ == "__main__":
    unittest.main()

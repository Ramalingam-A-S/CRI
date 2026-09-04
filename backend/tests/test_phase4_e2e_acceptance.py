import httpx
import pytest

BASE_URL = "http://127.0.0.1:8000/api"

class TestPhase4E2EAcceptance:

    def test_01_backend_health(self):
        resp = httpx.get(f"{BASE_URL}/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    def test_02_operating_modes_transition(self):
        r_cloud = httpx.post(f"{BASE_URL}/v1/mode", json={"mode": "CLOUD"})
        assert r_cloud.status_code == 200
        assert r_cloud.json()["mode"] == "CLOUD"

        r_edge = httpx.post(f"{BASE_URL}/v1/mode", json={"mode": "LOCAL_EDGE"})
        assert r_edge.status_code == 200
        assert r_edge.json()["mode"] == "LOCAL_EDGE"
        
        r_ass_edge = httpx.get(f"{BASE_URL}/v1/risk/assessment?mode=LOCAL_EDGE")
        assert r_ass_edge.status_code == 200
        data_edge = r_ass_edge.json()
        assert data_edge["mode"] == "LOCAL_EDGE"
        assert data_edge["explanationAvailable"] is False

        r_nodata = httpx.post(f"{BASE_URL}/v1/mode", json={"mode": "NO_DATA"})
        assert r_nodata.status_code == 200
        
        r_ass_nodata = httpx.get(f"{BASE_URL}/v1/risk/assessment?mode=NO_DATA")
        assert r_ass_nodata.status_code == 200
        data_nodata = r_ass_nodata.json()
        assert data_nodata["mode"] == "NO_DATA"
        assert "timestamp" in data_nodata
        assert data_nodata["status"] == "NO_DATA"

        httpx.post(f"{BASE_URL}/v1/mode", json={"mode": "CLOUD"})

    def test_03_risk_assessment_schema(self):
        r = httpx.get(f"{BASE_URL}/v1/risk/assessment")
        assert r.status_code == 200
        data = r.json()
        assert "riskScore" in data
        assert "confidence" in data
        assert "currentAreas" in data
        assert "predictedAreas" in data
        assert "contributingFactors" in data
        assert isinstance(data["currentAreas"], list)
        assert isinstance(data["predictedAreas"], list)

    def test_04_simulation_chain_e2e(self):
        httpx.post(f"{BASE_URL}/reset-simulation")

        sim_payload = {
            "rainfall_mm_h": 180.0,
            "temperature_c": 32.0,
            "wind_speed_kmh": 65.0,
            "soil_moisture_ratio": 0.85,
            "pressure_hpa": 985.0
        }
        r = httpx.post(f"{BASE_URL}/simulate", json=sim_payload)
        assert r.status_code == 200
        sim_res = r.json()
        assert sim_res["status"] == "SIMULATED"

        ass = sim_res["riskAssessment"]
        assert ass["riskScore"] > 70
        assert ass["severity"] in ["HIGH", "CRITICAL"]
        assert len(sim_res["activeAlerts"]) > 0

        alerts = httpx.get(f"{BASE_URL}/v1/alerts").json()
        assert len(alerts) > 0

        reset_r = httpx.post(f"{BASE_URL}/reset-simulation")
        assert reset_r.status_code == 200
        assert reset_r.json()["status"] == "RESET"

    def test_05_alert_acknowledgment(self):
        httpx.post(f"{BASE_URL}/simulate", json={"rainfall_mm_h": 150.0})
        alerts = httpx.get(f"{BASE_URL}/v1/alerts").json()
        assert len(alerts) > 0
        
        target_alert = alerts[0]
        alert_id = target_alert["id"]

        ack_r = httpx.post(f"{BASE_URL}/v1/alerts/acknowledge/{alert_id}")
        assert ack_r.status_code == 200
        ack_data = ack_r.json()
        assert ack_data["status"] == "ACKNOWLEDGED"

        httpx.post(f"{BASE_URL}/reset-simulation")

    def test_06_sensor_telemetry_ingestion(self):
        sensors_before = httpx.get(f"{BASE_URL}/v1/sensors").json()
        if len(sensors_before) == 0:
            httpx.post(f"{BASE_URL}/v1/sensors", json={"name": "Acceptance Telemetry Node", "lat": 13.386, "lng": 79.798})
            sensors_before = httpx.get(f"{BASE_URL}/v1/sensors").json()
        assert len(sensors_before) > 0

        target_id = sensors_before[0]["id"]
        ingest_payload = {
            "sensor_id": target_id,
            "readings": {"temperature": 180.0, "rainfall": 95.0}
        }
        r = httpx.post(f"{BASE_URL}/v1/sensors/ingest", json=ingest_payload)
        assert r.status_code == 200
        sensor_data = r.json()["sensor"]
        assert sensor_data["anomaly"] == "ANOMALOUS"
        assert sensor_data["health"] == "ANOMALOUS"

    def test_07_admin_hotspot_crud(self):
        new_hs = {
            "name": "Phase 4 E2E Test Hotspot",
            "hazard": "FLOOD",
            "severity": "CRITICAL",
            "baselineRiskScore": 90,
            "latitude": 13.3860,
            "longitude": 79.7980,
            "radius_m": 600,
            "active": True,
            "notes": "Automated phase 4 acceptance test hotspot"
        }
        create_r = httpx.post(f"{BASE_URL}/v1/hotspots", json=new_hs)
        assert create_r.status_code == 201
        created = create_r.json()
        hs_id = created["id"]
        assert created["name"] == new_hs["name"]

        update_r = httpx.put(f"{BASE_URL}/v1/hotspots/{hs_id}", json={"baselineRiskScore": 95, "active": False})
        assert update_r.status_code == 200
        assert update_r.json()["baselineRiskScore"] == 95

        del_r = httpx.delete(f"{BASE_URL}/v1/hotspots/{hs_id}")
        assert del_r.status_code == 200
        assert del_r.json()["status"] == "deleted"

    def test_08_citizen_incident_reporting(self):
        new_inc = {
            "title": "Submerged Railway Underpass",
            "hazard": "FLOOD",
            "severity": "HIGH",
            "latitude": 13.3860,
            "longitude": 79.7980,
            "reporter": "Field Command Test Officer",
            "description": "Standing water blocking emergency access"
        }
        r = httpx.post(f"{BASE_URL}/v1/incidents", json=new_inc)
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == new_inc["title"]

        incidents = httpx.get(f"{BASE_URL}/v1/incidents").json()
        assert any(i["id"] == data["id"] for i in incidents)

    def test_09_shelters_and_infrastructure(self):
        shl = httpx.get(f"{BASE_URL}/v1/shelters").json()
        assert len(shl) > 0
        assert "capacity" in shl[0]
        assert "currentOccupancy" in shl[0]

        inf = httpx.get(f"{BASE_URL}/v1/infrastructure").json()
        assert len(inf) > 0
        assert "criticalLevel" in inf[0]

    def test_10_hazard_filter_spatial_areas_integrity(self):
        # In single-region platform, populate sample hotspots for each hazard type if needed
        for haz in ["FLOOD", "HEAT", "LANDSLIDE", "STORM"]:
            httpx.post(f"{BASE_URL}/v1/hotspots", json={
                "name": f"Acceptance {haz} Hotspot",
                "hazard": haz,
                "latitude": 13.3860,
                "longitude": 79.7980
            })

        r = httpx.get(f"{BASE_URL}/v1/risk/assessment")
        assert r.status_code == 200
        data = r.json()

        curr_areas = data["currentAreas"]
        pred_areas = data["predictedAreas"]

        # Ensure spatial areas exist for all 4 hazard types
        curr_hazards = {a["hazardType"].upper() for a in curr_areas}
        pred_hazards = {a["hazardType"].upper() for a in pred_areas}

        expected = {"FLOOD", "HEAT", "LANDSLIDE", "STORM"}
        assert expected.issubset(curr_hazards), f"Missing hazard types in currentAreas: {expected - curr_hazards}"
        assert expected.issubset(pred_hazards), f"Missing hazard types in predictedAreas: {expected - pred_hazards}"

        # Test filtering
        for haz in ["FLOOD", "HEAT", "LANDSLIDE", "STORM"]:
            filtered_curr = [a for a in curr_areas if a["hazardType"].upper() == haz]
            filtered_pred = [a for a in pred_areas if a["hazardType"].upper() == haz]
            assert len(filtered_curr) > 0, f"Filtering by {haz} returned 0 current areas"
            assert len(filtered_pred) > 0, f"Filtering by {haz} returned 0 predicted areas"
            assert all(a["hazardType"].upper() == haz for a in filtered_curr)
            assert all(a["hazardType"].upper() == haz for a in filtered_pred)

    def test_11_directional_propagation_e2e(self):
        # Create sensor and directional hotspots
        s_res = httpx.post(f"{BASE_URL}/sensors", json={
            "name": "E2E Field Sensor",
            "lat": 13.3860,
            "lng": 79.7980
        }).json()
        s_id = s_res["id"]

        httpx.post(f"{BASE_URL}/hotspots", json={
            "name": "Western Landslide Target",
            "latitude": 13.3860,
            "longitude": 79.7500,
            "hazardTag": "landslide"
        })

        # Wind from east (90 deg) blows toward west (270 deg)
        sim_payload = {
            "eventType": "heavy_rain",
            "sensorId": s_id,
            "dataPoints": {
                "rainfallMmHr": 80.0,
                "windSpeedKmh": 50.0,
                "windDirectionDeg": 90.0
            }
        }
        res = httpx.post(f"{BASE_URL}/simulate/run", json=sim_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "SUCCESS"
        assert len(data["rankedCandidates"]) > 0
        top = data["rankedCandidates"][0]
        assert top["hazardTag"] == "landslide"
        assert top["probability"] > 50.0
        assert "cone" in top


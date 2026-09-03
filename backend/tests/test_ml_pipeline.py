import unittest
from ml.hazard_models import predict_flood, predict_heat, predict_landslide, OperatingMode, risk_fusion
from ml.anomaly_detection import check_sensor_quality

class TestMLPipeline(unittest.TestCase):
    
    def setUp(self):
        self.weather_normal = {"temperature": 25.0, "humidity": 50.0, "rainfall": 0.0, "windSpeed": 10.0, "pressure": 1010.0}
        self.weather_extreme = {"temperature": 45.0, "humidity": 90.0, "rainfall": 150.0, "windSpeed": 120.0, "pressure": 950.0}
        self.weather_anomalous = {"temperature": 150.0, "humidity": -10.0} # Impossible values
        self.geo = {"elevation": 10.0, "slope": 0.0, "water_proximity": 100.0, "historical_susceptibility": 0.8}

    def test_cloud_mode_inference(self):
        """Test normal CLOUD inference with extreme weather."""
        flood = predict_flood(self.weather_extreme, self.geo, OperatingMode.CLOUD)
        self.assertIn("riskScore", flood)
        self.assertIn("factors", flood)
        # Should be capped at 0.50 because models are synthetic
        self.assertEqual(flood["confidence"], 0.50)
        
    def test_local_edge_mode(self):
        """Test that LOCAL_EDGE mode degrades confidence appropriately."""
        flood = predict_flood(self.weather_normal, self.geo, OperatingMode.LOCAL_EDGE)
        self.assertLess(flood["confidence"], 0.50) # Edge mode uses less compute/data, confidence should drop
        
    def test_no_data_mode(self):
        """Test NO_DATA mode returns zero risk and zero confidence."""
        heat = predict_heat(self.weather_extreme, self.geo, OperatingMode.NO_DATA)
        self.assertEqual(heat["riskScore"], 0.0)
        self.assertEqual(heat["confidence"], 0.0)
        
    def test_anomaly_detection_and_fusion_penalty(self):
        """Test that impossible sensor values trigger anomalies and penalize the fusion confidence."""
        # 1. Check anomalies
        metrics = check_sensor_quality("sensor_1", self.weather_anomalous)
        self.assertTrue(any(a["type"] == "PHYSICAL_LIMIT_EXCEEDED" for a in metrics["anomalies"]))
        self.assertLess(metrics["qualityScore"], 1.0)
        
        # 2. Check Risk Fusion degradation
        flood = predict_flood(self.weather_anomalous, self.geo, OperatingMode.CLOUD)
        fusion = risk_fusion({"flood": flood}, sensor_quality=metrics["qualityScore"])
        
        # Confidence should be lowered by the sensor quality multiplier
        self.assertLess(fusion["overallConfidence"], flood["confidence"])

if __name__ == '__main__':
    unittest.main()

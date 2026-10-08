"""
Sample Machine Learning Pipeline Script
Demonstrates basic model creation, prediction, and integration capability with FastAPI.
"""

class SimpleClassifier:
    def __init__(self, name="Singularity ML Baseline"):
        self.name = name

    def predict(self, input_features: list[float]) -> dict:
        """
        Simulate inference pipeline.
        """
        score = sum(input_features) / (len(input_features) or 1)
        prediction = 1 if score > 0.5 else 0
        confidence = min(max(score, 0.0), 1.0)
        
        return {
            "model_name": self.name,
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "status": "success"
        }

if __name__ == "__main__":
    model = SimpleClassifier()
    sample_input = [0.8, 0.6, 0.9]
    result = model.predict(sample_input)
    print("🤖 Machine Learning Inference Result:")
    print(result)

import urllib.request
import urllib.parse
import json
from app.config import settings

class ExplanationService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.LLM_MODEL
        
        if self.api_key and self.api_key != "your-key-here":
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
            except ImportError:
                self.model = None
        else:
            self.model = None

    def generate_explanation(self, rule_name: str, status: str, extracted_value: str, source: str) -> str:
        prompt = f"""
        You are a compliance assistant explaining a rule evaluation result to a procurement officer.
        Rule: {rule_name}
        Status: {status}
        Value found: {extracted_value or 'N/A'}
        Source: {source}
        
        Write a single clear, professional sentence explaining this result. 
        Do not change the status or make a judgment. Only explain what was found.
        """
        
        if not self.model:
            # Fallback to free unauthenticated API if Gemini API Key isn't configured
            try:
                data = json.dumps({"messages": [{"role": "user", "content": prompt}]}).encode("utf-8")
                req = urllib.request.Request("https://text.pollinations.ai/", data=data, headers={"Content-Type": "application/json"})
                response = urllib.request.urlopen(req, timeout=10)
                return response.read().decode("utf-8").strip()
            except Exception:
                return f"System Explanation: The {rule_name} check resulted in {status} based on {source}."

        try:
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config={"max_output_tokens": 100}
                )
                return response.text.strip()
            except Exception as e:
                if "404" in str(e):
                    # Fallback to gemini-pro if 1.5-flash is not available for this API key/region
                    import google.generativeai as genai
                    fallback_model = genai.GenerativeModel("gemini-pro")
                    response = fallback_model.generate_content(prompt, generation_config={"max_output_tokens": 100})
                    return response.text.strip()
                raise e
        except Exception as e:
            return f"Error generating explanation: {str(e)}"

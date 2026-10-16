import os
import unittest
from unittest.mock import patch

import app


class AssistantRoutesTest(unittest.TestCase):
    def setUp(self):
        self.client = app.app.test_client()

    def test_home_page_loads(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Learn AF", response.data)

    @patch("app.requests.post")
    @patch.dict(os.environ, {"AI_API_KEY": "test-key"})
    def test_model_request_uses_bearer_api_key(self, post):
        post.return_value.json.return_value = {
            "choices": [{"message": {"content": '{"ok": true}'}}]
        }

        result = app.ask_model("instructions", "material")

        self.assertEqual(result, {"ok": True})
        self.assertEqual(post.call_args.kwargs["headers"]["Authorization"], "Bearer test-key")

    def test_explanation_rejects_empty_notes_and_invalid_language(self):
        empty_notes = self.client.post("/api/explain", json={"notes": "  "})
        invalid_language = self.client.post("/api/explain", json={"notes": "Notes", "language": []})
        self.assertEqual(empty_notes.status_code, 400)
        self.assertEqual(invalid_language.status_code, 400)

    @patch.object(
        app,
        "ask_model",
        return_value={"explanation": "Simple explanation", "key_points": ["Point one"]},
    )
    def test_explanation_returns_generated_content(self, ask_model):
        response = self.client.post(
            "/api/explain",
            json={"notes": "Study notes", "language": "Telugu"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json,
            {"explanation": "Simple explanation", "key_points": ["Point one"]},
        )
        self.assertIn("Telugu", ask_model.call_args.args[0])

    def test_quiz_rejects_invalid_question_count(self):
        response = self.client.post("/api/quiz", json={"notes": "Notes", "count": 2})
        self.assertEqual(response.status_code, 400)

    @patch.object(
        app,
        "ask_model",
        return_value={
            "questions": [
                {
                    "question": f"Question {index}",
                    "options": ["A", "B", "C", "D"],
                    "answer_index": 1,
                    "explanation": "Because",
                    "topic": "Topic",
                }
                for index in range(3)
            ]
        },
    )
    def test_quiz_returns_requested_number_of_questions(self, _ask_model):
        response = self.client.post("/api/quiz", json={"notes": "Study notes", "count": 3})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["questions"]), 3)


if __name__ == "__main__":
    unittest.main()

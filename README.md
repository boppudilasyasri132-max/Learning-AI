# Learn AF

Learn AF is a personalized learning assistant for turning study notes into simple explanations and multiple-choice quizzes. It supports English and Telugu, scores quiz answers, and points out topics to revise.

## Run locally

1. Create and activate a virtual environment:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. Configure an OpenAI-compatible chat completions API. Set your key, API base URL, and model in PowerShell:

   ```powershell
   $env:AI_API_KEY = "your-api-key"
   $env:AI_API_BASE_URL = "https://api.openai.com/v1"
   $env:AI_MODEL = "gpt-4o-mini"
   ```

   The app reads environment variables directly; it does not load `.env` automatically. Use the base URL for your chosen provider (the app appends `/chat/completions`). Keep API keys private and do not commit them.

4. Start the development server:

   ```powershell
   py app.py
   ```

5. Open <http://127.0.0.1:5000>.

## Features

- Simple explanations and key points generated from pasted notes.
- Multiple-choice quizzes with 3-10 questions.
- Instant scoring and a revision list based on missed topics.
- English and Telugu output.
- API base URL, model, and key configured through environment variables.

The app expects an OpenAI-compatible `/chat/completions` endpoint that supports JSON response format. Quiz scoring happens in the browser; generated answer keys are not sent back to the server for grading.

## Run tests

```powershell
python -m unittest discover -s tests
```

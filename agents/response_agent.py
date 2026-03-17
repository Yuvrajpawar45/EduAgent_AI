import requests

# Ollama runs as a local server at this address
OLLAMA_BASE_URL = "http://localhost:11434"
MODEL_NAME = "phi3:mini"


class ResponseGenerationAgent:
    """
    Generates AI responses using the local phi3:mini model via Ollama.

    Key concept — Retrieval Augmented Generation (RAG):
    Instead of asking the AI to make up answers (which can be wrong),
    we first RETRIEVE real data from our database, then give that data
    to the AI and say "answer ONLY based on this". This keeps responses
    accurate and institution-specific.
    """

    def __init__(self):
        self.api_url = f"{OLLAMA_BASE_URL}/api/generate"
        self.model = MODEL_NAME
        print(f"✅ Response Agent initialized — using local model: {MODEL_NAME}")

    def format_context(self, retrieved_data: dict) -> str:
        """
        Convert database results into a clean text block.
        This text becomes the "context" we give to the AI.

        Parameters:
            retrieved_data (dict): Data from InformationRetrievalAgent

        Returns:
            str: Formatted context text
        """
        parts = []

        # --- FAQs ---
        if retrieved_data.get("faqs"):
            parts.append("RELEVANT ACADEMIC FAQs:")
            for i, faq in enumerate(retrieved_data["faqs"], 1):
                parts.append(f"  Q{i}: {faq['question']}")
                parts.append(f"  A{i}: {faq['answer']}")
                parts.append("")  # blank line between entries

        # --- Exam Schedule ---
        if retrieved_data.get("exam_schedule"):
            parts.append("EXAM SCHEDULE:")
            for exam in retrieved_data["exam_schedule"]:
                parts.append(
                    f"  • {exam['subject']}: "
                    f"{exam['date']} at {exam['time']} — Venue: {exam['venue']}"
                )
            parts.append("")

        # --- Fee Structure ---
        if retrieved_data.get("fees"):
            parts.append("FEE STRUCTURE:")
            for fee in retrieved_data["fees"]:
                parts.append(
                    f"  • {fee['type']}: Rs. {fee['amount']} "
                    f"(Due: {fee['due_date']})"
                )
                if fee.get("description"):
                    parts.append(f"    → {fee['description']}")
            parts.append("")

        # --- PDF Content (from uploaded documents) ---
        if retrieved_data.get("pdf_context"):
            parts.append("FROM COLLEGE DOCUMENTS/HANDBOOKS:")
            parts.append(retrieved_data["pdf_context"])
            parts.append("")

        if not parts:
            return "No specific information found in the academic database."

        return "\n".join(parts)

    def generate(self, student_query: str, retrieved_data: dict) -> str:
        """
        Generate a helpful response using phi3:mini.

        Parameters:
            student_query  (str):  The student's original question
            retrieved_data (dict): Data from InformationRetrievalAgent

        Returns:
            str: The AI-generated response

        About phi3:mini:
        - Size: 3.8 billion parameters
        - RAM needed: ~4GB
        - Speed: 10–60 seconds per response (depends on your hardware)
        - Quality: Very good for factual Q&A with provided context
        """
        # Build the context string from database results
        context = self.format_context(retrieved_data)

        # ---- PROMPT ENGINEERING ----
        # Phi3 uses a special format with <|system|>, <|user|>, <|assistant|> tags.
        # The system section tells the AI WHO it is and what RULES to follow.
        # The user section contains the actual question + context.
        # The assistant tag is left open — phi3 fills it in.

        prompt = (
            "<|system|>\n"
            "You are EduAgent AI, a friendly and helpful academic assistant "
            "for college students.\n\n"
            "STRICT RULES you must follow:\n"
            "1. Answer ONLY using the information provided in the context below.\n"
            "2. If the answer is NOT in the context, say: "
            "'I don't have that specific information. Please contact the administrative "
            "office or check the college website for accurate details.'\n"
            "3. Keep your answer clear, well-structured, and easy to read.\n"
            "4. Use bullet points or numbered lists when listing multiple items.\n"
            "5. Be warm and supportive in tone — students may be confused or stressed.\n"
            "6. Always end your response with: "
            "'Is there anything else I can help you with?'\n"
            "7. Do NOT make up information that is not in the context.\n"
            "<|end|>\n"
            "<|user|>\n"
            f"--- ACADEMIC DATABASE CONTEXT ---\n"
            f"{context}\n"
            f"--- END OF CONTEXT ---\n\n"
            f"Student's Question: {student_query}\n"
            "<|end|>\n"
            "<|assistant|>\n"
        )

        try:
            print(f"🧠 Response Agent: Sending query to {MODEL_NAME}...")

            response = requests.post(
                self.api_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,       # Get the full response at once (not streaming)
                    "options": {
                        "temperature": 0.3,    # Low = more factual, less creative
                        "num_predict": 500,    # Max number of tokens to generate
                        "top_p": 0.9,          # Controls response diversity
                        "repeat_penalty": 1.1  # Prevents repetitive output
                    }
                },
                timeout=180  # 3 minutes max — phi3 can be slow on first load
            )

            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "").strip()

                if generated_text:
                    print(f"✅ Response generated: {len(generated_text)} characters")
                    return generated_text
                else:
                    return (
                        "I received an empty response from the AI. "
                        "Please try asking your question again."
                    )

            else:
                return (
                    f"⚠️ The AI returned an error (HTTP {response.status_code}). "
                    "Please try again in a moment."
                )

        except requests.exceptions.Timeout:
            return (
                "⏳ **The AI is taking longer than expected.**\n\n"
                "phi3:mini sometimes takes up to 2 minutes on the first query "
                "while it loads the model into memory.\n\n"
                "Please try again — it should be faster now that the model is loaded."
            )

        except requests.exceptions.ConnectionError:
            return (
                "❌ **Cannot connect to the local AI.**\n\n"
                "Ollama doesn't seem to be running.\n\n"
                "**Fix:** Open a terminal and run: `ollama serve`\n"
                "Then refresh this page."
            )

        except Exception as e:
            print(f"❌ Unexpected error in ResponseAgent: {e}")
            return (
                f"❌ An unexpected error occurred: {str(e)}\n\n"
                "Please try again or contact technical support."
            )
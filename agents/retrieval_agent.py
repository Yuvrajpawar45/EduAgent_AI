class InformationRetrievalAgent:
    """
    Retrieves relevant academic information from:
      - MongoDB Atlas (FAQs, exam schedules, fee structure)
      - FAISS vector database (uploaded PDF documents)
    """

    def __init__(self):
        self._pdf_processor = None

    def _get_pdf_processor(self):
        """Load PDF processor only when needed (lazy loading)."""
        if self._pdf_processor is None:
            try:
                from utils.pdf_processor import PDFProcessor
                self._pdf_processor = PDFProcessor()
            except Exception as e:
                print(f"⚠️  PDF Processor not available: {e}")
        return self._pdf_processor

    def search_faqs(self, query_text: str, category: str) -> list:
        """
        Search MongoDB faqs collection for relevant questions.

        Parameters:
            query_text (str): The student's question
            category   (str): Detected category from QueryAgent

        Returns:
            list of FAQ dicts with question, answer, category
        """
        try:
            from database.mongo_db import search_faqs
            results = search_faqs(query_text, category)
            print(f"   MongoDB: Found {len(results)} matching FAQs")
            return results
        except Exception as e:
            print(f"⚠️  FAQ search error: {e}")
            return []

    def get_exam_schedule(self) -> list:
        """Fetch all exam schedules from MongoDB."""
        try:
            from database.mongo_db import get_all_exams
            exams = get_all_exams()
            # Rename fields to match what response_agent expects
            return [
                {
                    "subject":  e.get("subject",   ""),
                    "date":     e.get("exam_date",  ""),
                    "time":     e.get("exam_time",  ""),
                    "venue":    e.get("venue",      ""),
                    "semester": e.get("semester",   "")
                }
                for e in exams
            ]
        except Exception as e:
            print(f"⚠️  Exam fetch error: {e}")
            return []

    def get_fee_structure(self) -> list:
        """Fetch all fee structure entries from MongoDB."""
        try:
            from database.mongo_db import get_all_fees
            fees = get_all_fees()
            # Rename fields to match what response_agent expects
            return [
                {
                    "type":        f.get("fee_type",    ""),
                    "amount":      f.get("amount",      0),
                    "due_date":    f.get("due_date",    ""),
                    "description": f.get("description", "")
                }
                for f in fees
            ]
        except Exception as e:
            print(f"⚠️  Fee fetch error: {e}")
            return []

    def search_pdfs(self, query: str) -> str:
        """Search uploaded PDF documents (FAISS vector search)."""
        try:
            pdf_processor = self._get_pdf_processor()
            if pdf_processor:
                return pdf_processor.search(query)
        except Exception as e:
            print(f"⚠️  PDF search error: {e}")
        return ""

    def retrieve(self, query_analysis: dict) -> dict:
        """
        MAIN METHOD — fetches all relevant data for the given query.

        Parameters:
            query_analysis (dict): Output from QueryUnderstandingAgent

        Returns:
            dict with faqs, exam_schedule, fees, pdf_context
        """
        category      = query_analysis["category"]
        original_query = query_analysis["original_query"]

        retrieved_data = {
            "faqs":          [],
            "exam_schedule": [],
            "fees":          [],
            "pdf_context":   "",
            "category":      category
        }

        # Always search FAQs
        retrieved_data["faqs"] = self.search_faqs(original_query, category)

        # Category-specific lookups
        if category == "exam":
            retrieved_data["exam_schedule"] = self.get_exam_schedule()

        if category == "fees":
            retrieved_data["fees"] = self.get_fee_structure()

        # Always search PDFs too
        pdf_results = self.search_pdfs(original_query)
        if pdf_results:
            retrieved_data["pdf_context"] = pdf_results

        print(
            f"📚 Retrieval Agent: {len(retrieved_data['faqs'])} FAQ(s) | "
            f"Exams: {'Yes' if retrieved_data['exam_schedule'] else 'No'} | "
            f"Fees: {'Yes' if retrieved_data['fees'] else 'No'} | "
            f"PDF: {'Yes' if pdf_results else 'No'}"
        )

        return retrieved_data
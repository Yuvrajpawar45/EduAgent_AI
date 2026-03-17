class QueryUnderstandingAgent:
    """
    Classifies student queries into academic categories
    and extracts relevant keywords for database search.

    Example:
        Input:  "What is the last date to pay semester fees?"
        Output: {
                  "category": "fees",
                  "keywords": ["fee", "payment", "semester fee"],
                  "original_query": "What is the last date to pay semester fees?",
                  "confidence": "high"
                }
    """

    def __init__(self):
        # Each category maps to a list of keywords/phrases that indicate it.
        # If a student's question contains any of these words,
        # it gets classified into that category.
        self.category_keywords = {
            "exam": [
                "exam", "examination", "test", "timetable", "time table",
                "schedule", "exam date", "exam schedule", "result", "results",
                "marks", "grade", "grades", "re-evaluation", "recheck",
                "re evaluation", "paper", "answer sheet", "hall ticket",
                "admit card", "practical exam", "internal exam", "semester exam"
            ],
            "fees": [
                "fee", "fees", "payment", "pay", "amount", "charges",
                "fine", "dues", "semester fee", "tuition", "tuition fee",
                "fee structure", "fee deadline", "late fee", "hostel fee",
                "library fee", "exam fee", "development fee"
            ],
            "attendance": [
                "attendance", "attend", "present", "absent", "absence",
                "percentage", "leave", "proxy", "minimum attendance",
                "attendance requirement", "shortage", "detained", "condonation"
            ],
            "scholarship": [
                "scholarship", "scholarships", "financial aid", "stipend",
                "merit scholarship", "merit list", "need-based", "bursary",
                "sports scholarship", "government scholarship", "fee waiver",
                "financial assistance", "free ship"
            ],
            "admission": [
                "admission", "admissions", "document", "documents", "certificate",
                "enrollment", "enroll", "joining", "registration", "register",
                "marksheet", "mark sheet", "tc", "transfer certificate",
                "migration", "migration certificate", "caste certificate",
                "eligibility", "eligibility criteria"
            ],
            "library": [
                "library", "book", "books", "borrow", "issue", "return",
                "library card", "library fine", "library hours", "reading room",
                "e-library", "digital library", "journal", "reference book"
            ],
            "general": [
                "bonafide", "bonafide certificate", "id card", "college id",
                "hostel", "transport", "bus", "canteen", "sports",
                "college timing", "office hours", "holiday", "holidays",
                "semester", "academic calendar", "principal", "contact"
            ]
        }

    def analyze(self, student_query: str) -> dict:
        """
        Analyze the student's query and return a structured result.

        How it works:
          - Convert query to lowercase
          - Count how many keywords from each category appear in the query
          - The category with the most matches wins
          - Collect all found keywords for the retrieval agent

        Parameters:
            student_query (str): The raw question from the student

        Returns:
            dict with:
              "category"       - best matching category name (str)
              "keywords"       - list of matched keywords (list)
              "original_query" - unchanged original query (str)
              "confidence"     - "high" if multiple matches, "low" if only one (str)
        """
        query_lower = student_query.lower()

        detected_category = "general"  # Default if no keywords match
        max_matches = 0
        all_found_keywords = []

        for category, keywords in self.category_keywords.items():
            matched = []
            for keyword in keywords:
                if keyword in query_lower:
                    matched.append(keyword)

            if len(matched) > max_matches:
                max_matches = len(matched)
                detected_category = category

            all_found_keywords.extend(matched)

        # Remove duplicates from keyword list
        unique_keywords = list(set(all_found_keywords))

        # Confidence is high if 2+ keywords matched, low if only 1 or 0
        confidence = "high" if max_matches >= 2 else "low"

        result = {
            "category": detected_category,
            "keywords": unique_keywords,
            "original_query": student_query,
            "confidence": confidence
        }

        print(
            f"🔍 Query Agent: '{detected_category}' category detected "
            f"({max_matches} keyword matches, confidence: {confidence})"
        )

        return result
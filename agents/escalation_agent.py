class EscalationAgent:
    """
    Detects sensitive queries and saves them to MongoDB for admin review.
    """

    def __init__(self):
        self.escalation_triggers = [
            "complaint", "complain", "grievance", "appeal",
            "unfair", "discrimination", "injustice",
            "harassment", "ragging", "bully", "threat", "threaten",
            "abuse", "violence", "danger", "unsafe",
            "mental health", "depressed", "depression", "anxiety",
            "suicide", "self harm", "hurt myself",
            "emergency", "accident", "urgent help",
            "fraud", "wrong result", "incorrect marks",
            "wrong marks", "result error", "cheating",
        ]

    def should_escalate(self, query: str) -> tuple:
        """Check if query contains sensitive keywords."""
        query_lower = query.lower()
        for trigger in self.escalation_triggers:
            if trigger in query_lower:
                return True, f"Sensitive topic detected: '{trigger}'"
        return False, None

    def save_to_database(self, query: str, reason: str):
        """Save flagged query to MongoDB Atlas."""
        try:
            from database.mongo_db import save_escalated_query
            save_escalated_query(query, reason)
        except Exception as e:
            print(f"❌ Could not save escalated query to MongoDB: {e}")

    def process(self, query: str) -> dict:
        """
        Check query and escalate if needed.

        Returns:
            dict with "escalated" (bool) and "message" (str)
        """
        needs_escalation, reason = self.should_escalate(query)

        if needs_escalation:
            self.save_to_database(query, reason)

            return {
                "escalated": True,
                "message": (
                    "⚠️ **Your query has been forwarded to our administrative staff.**\n\n"
                    "It looks like your question may need personal attention from our team. "
                    "A staff member will review your concern and respond within **24 hours**.\n\n"
                    "**In the meantime:**\n"
                    "- For urgent matters, visit the **Administrative Office** directly\n"
                    "- For emergencies, contact the **Principal's Office** immediately\n\n"
                    "You are not alone — we are here to help. 💙"
                )
            }

        return {"escalated": False, "message": None}
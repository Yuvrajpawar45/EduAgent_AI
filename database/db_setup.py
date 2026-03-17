import sqlite3
import os


def create_database():
    """
    Create all necessary tables in the SQLite database.
    Uses 'CREATE TABLE IF NOT EXISTS' so running this multiple times is safe.
    """
    # Make sure the database folder exists
    os.makedirs("database", exist_ok=True)

    conn = sqlite3.connect("database/academic.db")
    cursor = conn.cursor()

    # ---- TABLE 1: FAQs ----
    # Stores common Q&A pairs organized by category
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS faqs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            category    TEXT    NOT NULL,
            question    TEXT    NOT NULL,
            answer      TEXT    NOT NULL,
            keywords    TEXT,
            created_at  TEXT    DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ---- TABLE 2: Exam Schedules ----
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exam_schedules (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            subject     TEXT    NOT NULL,
            exam_date   TEXT    NOT NULL,
            exam_time   TEXT    NOT NULL,
            venue       TEXT,
            semester    INTEGER
        )
    """)

    # ---- TABLE 3: Fee Structure ----
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fee_structure (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            fee_type    TEXT    NOT NULL,
            amount      REAL    NOT NULL,
            due_date    TEXT,
            description TEXT
        )
    """)

    # ---- TABLE 4: Escalated Queries ----
    # Queries flagged by the escalation agent for human review
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS escalated_queries (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            student_query TEXT    NOT NULL,
            reason        TEXT,
            timestamp     TEXT,
            status        TEXT    DEFAULT 'pending',
            admin_notes   TEXT
        )
    """)

    # ---- TABLE 5: Uploaded PDFs ----
    # Tracks which PDF files have been uploaded and processed
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS uploaded_pdfs (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            filename      TEXT    NOT NULL,
            original_name TEXT,
            pages         INTEGER,
            chunks        INTEGER,
            uploaded_at   TEXT    DEFAULT CURRENT_TIMESTAMP,
            uploaded_by   TEXT    DEFAULT 'admin'
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Database tables created successfully!")
    print("   Location: database/academic.db")


if __name__ == "__main__":
    create_database()
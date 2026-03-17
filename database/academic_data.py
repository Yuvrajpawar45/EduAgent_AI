import sqlite3
import os


def seed_data():
    """Insert sample FAQs, exam schedules, and fee structure."""

    db_path = "database/academic.db"
    if not os.path.exists(db_path):
        print("❌ Database not found! Run 'python database/db_setup.py' first.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ============================================================
    # SEED: FAQs
    # Format: (category, question, answer, keywords)
    # ============================================================
    faqs = [
        (
            "Attendance",
            "What is the minimum attendance requirement?",
            "The minimum attendance requirement is 75%. Students with attendance below "
            "75% will not be permitted to appear in the final examinations. Students with "
            "attendance between 65-74% may apply for condonation with valid medical documents. "
            "Below 65% results in automatic detention.",
            "attendance, minimum, requirement, percentage, 75, detained, condonation"
        ),
        (
            "Attendance",
            "How can I apply for attendance condonation?",
            "Students with attendance between 65-74% can apply for condonation. Submit Form "
            "ATT-02 to the academic office with your medical certificate or valid reason. "
            "Applications must be submitted at least 7 days before the exam. "
            "The condonation committee reviews each case individually.",
            "condonation, leave, medical, attendance shortage, form, apply"
        ),
        (
            "Fees",
            "What is the fee payment deadline?",
            "Semester fees must be paid within the first 30 days of the semester start date. "
            "Late payments attract a fine of Rs. 100 per day after the deadline. "
            "Students with unpaid fees will not receive their hall tickets for semester exams. "
            "Fee payment can be done online via the student portal or at the accounts office.",
            "fee, payment, deadline, semester, fine, late fee, hall ticket"
        ),
        (
            "Fees",
            "Can I pay fees in installments?",
            "Yes, fees can be paid in two installments upon approval. Submit an installment "
            "request form to the Accounts Department with a valid reason. First installment "
            "(60% of total) must be paid by the 30th day of the semester, and the remaining "
            "40% within 60 days.",
            "installment, partial payment, fee payment, emi, split fee"
        ),
        (
            "Exam",
            "How do I apply for re-evaluation of exam papers?",
            "You can apply for re-evaluation within 7 days of the result declaration date. "
            "Collect Form RE-01 from the examination department. Submit the filled form with "
            "a fee of Rs. 500 per subject. Results are typically updated within 3-4 weeks. "
            "If marks improve, the re-evaluation fee is refunded.",
            "re-evaluation, recheck, result, exam, marks, form, paper viewing"
        ),
        (
            "Exam",
            "How do I get my hall ticket for the semester exam?",
            "Hall tickets are issued 7-10 days before the exam start date. Requirements: "
            "fees must be fully paid, attendance must be above 75%, and no pending library "
            "books or dues. Download from the student portal or collect from the exam section. "
            "Hall ticket is mandatory for entry to the examination hall.",
            "hall ticket, admit card, exam entry, exam section, download"
        ),
        (
            "Scholarship",
            "What scholarships are available for students?",
            "Available scholarships at our institution:\n"
            "1. Merit Scholarship: For students in top 10% of their class. Amount: Rs. 10,000/year.\n"
            "2. Need-based Scholarship: For economically weaker sections. Up to full fee waiver.\n"
            "3. Sports Scholarship: For national/state-level sports achievers. Rs. 5,000/semester.\n"
            "4. Government Scholarships: SC/ST/OBC scholarships available through state portal.\n"
            "Contact the scholarship desk in Block C for application forms.",
            "scholarship, merit, need-based, sports, sc, st, obc, financial aid, stipend"
        ),
        (
            "Scholarship",
            "When is the scholarship application deadline?",
            "Scholarship applications for the academic year open in August and close on "
            "September 30th. Government scholarship applications follow state government "
            "timelines (usually October-November). Merit scholarship is awarded automatically "
            "based on previous semester results — no application needed.",
            "scholarship deadline, apply scholarship, last date, scholarship form"
        ),
        (
            "Admission",
            "What documents are required for admission?",
            "Required documents for admission:\n"
            "1. 10th standard marksheet and passing certificate\n"
            "2. 12th standard marksheet and passing certificate\n"
            "3. Transfer Certificate (TC) from previous institution\n"
            "4. Migration Certificate (for students from other universities)\n"
            "5. 4 recent passport-size photographs\n"
            "6. Aadhar Card photocopy\n"
            "7. Caste certificate (if applicable)\n"
            "8. Medical fitness certificate\n"
            "All originals must be presented at the time of verification.",
            "admission, documents, required, certificate, marksheet, tc, migration, aadhar"
        ),
        (
            "Library",
            "How many books can I borrow from the library?",
            "Students can borrow up to 4 books at a time for a period of 14 days. "
            "Books can be renewed once for an additional 7 days if not reserved by another student. "
            "Late returns attract a fine of Rs. 2 per day per book. "
            "Reference books and journals are for in-library use only. "
            "The library is open Monday to Saturday, 8:00 AM to 7:00 PM.",
            "library, books, borrow, issue, return, fine, renew, library card"
        ),
        (
            "General",
            "How do I get a bonafide certificate?",
            "To obtain a bonafide certificate:\n"
            "1. Visit the administrative office during working hours (9 AM - 4 PM)\n"
            "2. Bring your college ID card\n"
            "3. Fill out the request form and specify the purpose\n"
            "The certificate is issued within 2 working days. "
            "For urgent needs, an express service (same day) is available with prior approval.",
            "bonafide, certificate, document, official, attestation"
        ),
        (
            "General",
            "What are the college working hours?",
            "College working hours:\n"
            "- Classes: Monday to Saturday, 8:00 AM to 5:00 PM\n"
            "- Administrative Office: Monday to Friday, 9:00 AM to 4:30 PM\n"
            "- Library: Monday to Saturday, 8:00 AM to 7:00 PM\n"
            "- Principal's Office: By appointment (contact reception)\n"
            "The college is closed on all national holidays and during semester breaks.",
            "timing, hours, office hours, college time, working hours, schedule"
        ),
    ]

    # INSERT OR IGNORE prevents duplicate entries if script is run multiple times
    cursor.executemany(
        """INSERT OR IGNORE INTO faqs (category, question, answer, keywords)
           VALUES (?, ?, ?, ?)""",
        faqs
    )
    print(f"✅ Inserted {len(faqs)} FAQ entries")

    # ============================================================
    # SEED: Exam Schedules
    # Format: (subject, exam_date, exam_time, venue, semester)
    # ============================================================
    exams = [
        ("Mathematics",         "2025-03-10", "10:00 AM", "Hall A",  2),
        ("Physics",             "2025-03-12", "10:00 AM", "Hall B",  2),
        ("Computer Science",    "2025-03-14", "02:00 PM", "Lab 1",   2),
        ("English Communication","2025-03-16", "10:00 AM", "Hall A", 2),
        ("Chemistry",           "2025-03-18", "10:00 AM", "Hall C",  2),
        ("Engineering Drawing", "2025-03-20", "10:00 AM", "Drawing Hall", 2),
        ("Environmental Science","2025-03-22", "10:00 AM", "Hall B", 2),
    ]

    cursor.executemany(
        """INSERT OR IGNORE INTO exam_schedules
           (subject, exam_date, exam_time, venue, semester)
           VALUES (?, ?, ?, ?, ?)""",
        exams
    )
    print(f"✅ Inserted {len(exams)} exam schedule entries")

    # ============================================================
    # SEED: Fee Structure
    # Format: (fee_type, amount, due_date, description)
    # ============================================================
    fees = [
        ("Tuition Fee",      45000.0, "Within 30 days of semester start",
         "Core academic fee for instruction and faculty"),
        ("Library Fee",        500.0, "At the time of admission",
         "Annual library access and book maintenance"),
        ("Sports Fee",         300.0, "At the time of admission",
         "Access to sports facilities and equipment"),
        ("Exam Fee",           800.0, "Before each semester examination",
         "Per-semester examination processing fee"),
        ("Development Fee",   2000.0, "At the time of admission",
         "Infrastructure development and maintenance"),
        ("Laboratory Fee",    1500.0, "Per semester, with exam fee",
         "Lab consumables and equipment maintenance"),
        ("Student Activity Fee", 200.0, "At the time of admission",
         "Cultural events, fests, and student clubs"),
    ]

    cursor.executemany(
        """INSERT OR IGNORE INTO fee_structure
           (fee_type, amount, due_date, description)
           VALUES (?, ?, ?, ?)""",
        fees
    )
    print(f"✅ Inserted {len(fees)} fee structure entries")

    conn.commit()
    conn.close()

    total = fees[-1][1] if fees else 0
    print("\n✅ All sample data seeded successfully!")
    print("   You can now run: streamlit run app.py")


if __name__ == "__main__":
    seed_data()
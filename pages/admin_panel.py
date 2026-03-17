import os
import sys
from datetime import datetime

import streamlit as st

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

st.set_page_config(
    page_title="EduAgent AI - Admin Panel",
    page_icon="EA",
    layout="wide",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'DM Sans', sans-serif;
    }

    .stApp {
        background: radial-gradient(circle at top right, #fff8e1 0%, #fff9f0 50%, #fdf2f5 100%);
    }

    .admin-hero {
        background: linear-gradient(135deg, #6b1d3a 0%, #9e3a5e 100%);
        border-radius: 16px;
        padding: 22px;
        color: #ffffff;
        margin-bottom: 14px;
        box-shadow: 0 12px 28px rgba(61, 15, 35, 0.22);
    }

    .admin-hero h1 {
        margin: 0;
        font-size: 1.8rem;
    }

    .admin-hero p {
        margin: 6px 0 0;
        color: #f8e7ee;
        font-size: 0.95rem;
    }

    .login-card {
        background: #ffffff;
        border: 1px solid #f0b8c8;
        border-radius: 14px;
        padding: 18px;
        box-shadow: 0 8px 22px rgba(84, 21, 48, 0.09);
    }
    </style>
    """,
    unsafe_allow_html=True,
)

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")


def check_authentication() -> bool:
    if "admin_authenticated" not in st.session_state:
        st.session_state.admin_authenticated = False

    if st.session_state.admin_authenticated:
        return True

    st.markdown(
        """
        <div class="admin-hero">
          <h1>Admin Panel</h1>
          <p>Restricted area for academic operations management.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<div class="login-card">', unsafe_allow_html=True)
        st.subheader("Admin Login")
        st.caption("Only authorized staff can edit records and review escalations.")
        entered = st.text_input("Password", type="password")
        login = st.button("Login", type="primary", use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

        if login:
            if entered == ADMIN_PASSWORD:
                st.session_state.admin_authenticated = True
                st.rerun()
            st.error("Incorrect password.")

    return False


if not check_authentication():
    st.sidebar.markdown("### Navigation")
    st.sidebar.page_link("app.py", label="Home")
    st.sidebar.page_link("pages/student_chat.py", label="Student Chat")
    st.sidebar.page_link("pages/admin_panel.py", label="Admin Panel")
    st.stop()

try:
    from database.mongo_db import (
        add_exam,
        add_faq,
        add_fee,
        delete_exam,
        delete_faq,
        delete_fee,
        delete_uploaded_pdf_record,
        get_all_exams,
        get_all_faqs,
        get_all_fees,
        get_all_uploaded_pdfs,
        get_escalated_queries,
        get_statistics,
        record_uploaded_pdf,
        update_escalated_query,
        update_faq,
    )
except Exception as exc:
    st.error(f"MongoDB connection failed: {exc}")
    st.stop()

with st.sidebar:
    st.markdown("### Navigation")
    st.page_link("app.py", label="Home")
    st.page_link("pages/student_chat.py", label="Student Chat")
    st.page_link("pages/admin_panel.py", label="Admin Panel")

    st.markdown("---")
    if st.button("Go to Student Chat", use_container_width=True):
        st.switch_page("pages/student_chat.py")

st.markdown(
    """
    <div class="admin-hero">
      <h1>EduAgent AI - Admin</h1>
      <p>Manage escalations, FAQs, documents, exams, and fee data.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

header_left, header_right = st.columns([4, 1])
with header_left:
    st.caption(f"Connected to MongoDB | {datetime.now().strftime('%A, %B %d %Y, %I:%M %p')}")
with header_right:
    if st.button("Logout", use_container_width=True):
        st.session_state.admin_authenticated = False
        st.rerun()

stats = get_statistics()
a, b, c, d, e, f = st.columns(6)
a.metric("FAQs", stats["total_faqs"])
b.metric("Escalated", stats["total_escalated"])
c.metric("Pending", stats["pending_escalated"])
d.metric("PDFs", stats["uploaded_pdfs"])
e.metric("Exams", stats["exam_entries"])
f.metric("Fees", stats["fee_entries"])

st.markdown("---")
tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["Escalated Queries", "Manage FAQs", "PDF Documents", "Exam Schedule", "Fee Structure"]
)

with tab1:
    st.subheader("Escalated Queries")
    status_filter = st.selectbox("Filter by status", ["all", "pending", "in-progress", "resolved"])
    queries = get_escalated_queries(status_filter)

    if not queries:
        st.info("No queries found for this filter.")
    else:
        for q in queries:
            with st.expander(f"[{q.get('timestamp', '')[:16]}] {q.get('student_query', '')[:90]}"):
                left, right = st.columns([3, 2])
                with left:
                    st.write("Query")
                    st.info(q.get("student_query", ""))
                    st.caption(f"Reason: {q.get('reason', '')}")
                    st.caption(f"Current status: {q.get('status', 'pending')}")
                    if q.get("admin_notes"):
                        st.write(f"Previous notes: {q['admin_notes']}")
                with right:
                    current_status = q.get("status", "pending")
                    options = ["pending", "in-progress", "resolved"]
                    new_status = st.selectbox(
                        "Update status",
                        options,
                        index=options.index(current_status) if current_status in options else 0,
                        key=f"esc_status_{q['_id']}",
                    )
                    notes = st.text_area("Admin notes", value=q.get("admin_notes", ""), key=f"esc_notes_{q['_id']}")
                    if st.button("Save", key=f"esc_save_{q['_id']}"):
                        if update_escalated_query(q["_id"], new_status, notes):
                            st.success("Updated.")
                            st.rerun()
                        else:
                            st.error("Update failed.")

with tab2:
    st.subheader("FAQ Management")
    with st.expander("Add New FAQ", expanded=False):
        with st.form("form_add_faq"):
            col_q, col_c = st.columns([3, 1])
            with col_q:
                new_q = st.text_input("Question")
            with col_c:
                new_cat = st.selectbox(
                    "Category",
                    ["Exam", "Fees", "Attendance", "Scholarship", "Admission", "Library", "General"],
                )
            new_ans = st.text_area("Answer", height=120)
            new_kw = st.text_input("Keywords (comma-separated)")

            if st.form_submit_button("Add FAQ", type="primary"):
                if new_q.strip() and new_ans.strip():
                    if add_faq(new_cat, new_q.strip(), new_ans.strip(), new_kw.strip()):
                        st.success("FAQ added.")
                        st.rerun()
                    else:
                        st.error("Failed to add FAQ.")
                else:
                    st.error("Question and answer are required.")

    st.markdown("---")
    all_faqs = get_all_faqs()
    categories = ["All"] + sorted(set(faq.get("category", "") for faq in all_faqs if faq.get("category")))
    selected_cat = st.selectbox("Filter by category", categories)
    display_faqs = all_faqs if selected_cat == "All" else [f for f in all_faqs if f.get("category") == selected_cat]

    if not display_faqs:
        st.info("No FAQs found.")
    else:
        for faq in display_faqs:
            with st.expander(f"[{faq.get('category', '?')}] {faq.get('question', '')[:90]}"):
                col_edit, col_act = st.columns([4, 1])
                with col_edit:
                    edited_ans = st.text_area("Answer", value=faq.get("answer", ""), key=f"faq_ans_{faq['_id']}")
                    edited_kw = st.text_input("Keywords", value=faq.get("keywords", ""), key=f"faq_kw_{faq['_id']}")
                with col_act:
                    if st.button("Update", key=f"faq_upd_{faq['_id']}", use_container_width=True):
                        if update_faq(faq["_id"], edited_ans, edited_kw):
                            st.success("Updated.")
                            st.rerun()
                    if st.button("Delete", key=f"faq_del_{faq['_id']}", use_container_width=True):
                        if delete_faq(faq["_id"]):
                            st.success("Deleted.")
                            st.rerun()

with tab3:
    st.subheader("PDF Document Management")
    st.caption("Upload institutional PDFs to enrich the assistant knowledge base.")

    uploaded_file = st.file_uploader("Select PDF", type=["pdf"])
    if uploaded_file:
        info_col, btn_col = st.columns([3, 1])
        with info_col:
            st.write(f"File: {uploaded_file.name}")
            st.caption(f"Size: {uploaded_file.size / 1024:.1f} KB")
        with btn_col:
            if st.button("Upload and Process", type="primary", use_container_width=True):
                with st.spinner("Processing PDF..."):
                    try:
                        os.makedirs("uploaded_pdfs", exist_ok=True)
                        save_path = os.path.join("uploaded_pdfs", uploaded_file.name)
                        with open(save_path, "wb") as file_out:
                            file_out.write(uploaded_file.getbuffer())

                        from utils.pdf_processor import PDFProcessor

                        result = PDFProcessor().process_pdf(save_path, uploaded_file.name)
                        if result["success"]:
                            record_uploaded_pdf(uploaded_file.name, result["pages"], result["chunks"])
                            st.success(f"Processed. Pages: {result['pages']} | Chunks: {result['chunks']}")
                            st.rerun()
                        else:
                            st.error(result.get("error", "Processing failed."))
                    except Exception as exc:
                        st.error(f"Upload failed: {exc}")

    st.markdown("---")
    pdfs = get_all_uploaded_pdfs()
    if not pdfs:
        st.info("No PDFs uploaded yet.")
    else:
        for pdf in pdfs:
            col_n, col_s, col_d = st.columns([4, 3, 1])
            with col_n:
                st.write(f"{pdf.get('original_name', '')}")
                st.caption(f"Uploaded: {pdf.get('uploaded_at', '')[:16]}")
            with col_s:
                st.caption(f"Pages: {pdf.get('pages', 0)} | Chunks: {pdf.get('chunks', 0)}")
            with col_d:
                if st.button("Delete", key=f"pdf_del_{pdf['_id']}", use_container_width=True):
                    delete_uploaded_pdf_record(pdf["_id"])
                    file_path = os.path.join("uploaded_pdfs", pdf.get("filename", ""))
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    st.rerun()
            st.markdown("---")

with tab4:
    st.subheader("Exam Schedule Management")
    with st.expander("Add New Exam"):
        with st.form("form_add_exam"):
            col_s, col_sem = st.columns([3, 1])
            with col_s:
                subject = st.text_input("Subject")
            with col_sem:
                semester = st.number_input("Semester", 1, 8, 1)

            col_d, col_t, col_v = st.columns(3)
            with col_d:
                exam_date = st.date_input("Date")
            with col_t:
                exam_time = st.time_input("Time")
            with col_v:
                venue = st.text_input("Venue")

            if st.form_submit_button("Add", type="primary"):
                if subject.strip():
                    if add_exam(subject.strip(), str(exam_date), str(exam_time), venue.strip(), semester):
                        st.success("Exam added.")
                        st.rerun()
                    else:
                        st.error("Failed to add exam.")
                else:
                    st.error("Subject is required.")

    exams = get_all_exams()
    if not exams:
        st.info("No exam entries yet.")
    else:
        for exam in exams:
            info_col, del_col = st.columns([5, 1])
            with info_col:
                st.write(
                    f"{exam.get('subject', '')} - {exam.get('exam_date', '')} at {exam.get('exam_time', '')} | "
                    f"Venue: {exam.get('venue', '')} | Semester: {exam.get('semester', '')}"
                )
            with del_col:
                if st.button("Delete", key=f"exam_del_{exam['_id']}", use_container_width=True):
                    if delete_exam(exam["_id"]):
                        st.rerun()
            st.markdown("---")

with tab5:
    st.subheader("Fee Structure Management")
    with st.expander("Add New Fee"):
        with st.form("form_add_fee"):
            col_ft, col_amt = st.columns(2)
            with col_ft:
                fee_type = st.text_input("Fee Type")
            with col_amt:
                amount = st.number_input("Amount (INR)", min_value=0.0, step=100.0)

            col_dd, col_desc = st.columns(2)
            with col_dd:
                due_date = st.text_input("Due Date")
            with col_desc:
                description = st.text_input("Description")

            if st.form_submit_button("Add", type="primary"):
                if fee_type.strip():
                    if add_fee(fee_type.strip(), amount, due_date.strip(), description.strip()):
                        st.success("Fee entry added.")
                        st.rerun()
                    else:
                        st.error("Failed to add fee entry.")
                else:
                    st.error("Fee type is required.")

    fees = get_all_fees()
    if not fees:
        st.info("No fee entries yet.")
    else:
        total = 0
        for fee in fees:
            info_col, del_col = st.columns([5, 1])
            with info_col:
                st.write(
                    f"{fee.get('fee_type', '')} - INR {fee.get('amount', 0):,.0f} | "
                    f"Due: {fee.get('due_date', '')} | {fee.get('description', '')}"
                )
            with del_col:
                if st.button("Delete", key=f"fee_del_{fee['_id']}", use_container_width=True):
                    if delete_fee(fee["_id"]):
                        st.rerun()
            total += fee.get("amount", 0)
            st.markdown("---")

        st.markdown(f"**Total Annual Fee: INR {total:,.0f}**")
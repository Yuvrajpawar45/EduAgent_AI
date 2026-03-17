import streamlit as st

st.set_page_config(
    page_title="EduAgent AI",
    page_icon="EA",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

    html, body, [class*="css"]  {
        font-family: 'DM Sans', sans-serif;
    }

    .stApp {
        background: radial-gradient(circle at top right, #fff8e1 0%, #fff9f0 45%, #fdf2f5 100%);
    }

    .hero {
        background: linear-gradient(135deg, #6b1d3a 0%, #9e3a5e 100%);
        color: #ffffff;
        padding: 28px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 12px 30px rgba(61, 15, 35, 0.2);
        margin-bottom: 18px;
    }

    .hero h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
    }

    .hero p {
        margin: 8px 0 0;
        color: #f8e7ee;
        font-size: 1rem;
    }

    .card {
        background: #ffffff;
        border: 1px solid #f0b8c8;
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 6px 16px rgba(84, 21, 48, 0.08);
    }

    .card h3 {
        margin-top: 0;
        color: #3d0f23;
    }

    .card p {
        color: #475569;
        margin-bottom: 12px;
    }

    .hint {
        background: #fff3e0;
        border: 1px solid #ffd9a8;
        color: #6b1d3a;
        padding: 12px 14px;
        border-radius: 10px;
        font-size: 0.93rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    """
    <div class="hero">
      <h1>EduAgent AI</h1>
      <p>Unified portal with separate Student Chat and Admin operations.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

left, right = st.columns(2)

with left:
    st.markdown(
        """
        <div class="card">
          <h3>Student Chat</h3>
          <p>Ask about exams, fees, attendance, scholarships, admissions, and policies.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Open Student Chat", use_container_width=True, type="primary"):
        st.switch_page("pages/student_chat.py")

with right:
    st.markdown(
        """
        <div class="card">
          <h3> Panel</h3>
          <p>Manage FAQs, escalations, documents, exam schedules, and fee records.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Open  Panel", use_container_width=True):
        st.switch_page("pages/_panel.py")

st.markdown(
    """
    <div class="hint">
      Admin access is password protected inside the Admin Panel. Students should use the Student Chat page.
    </div>
    """,
    unsafe_allow_html=True,
)

st.sidebar.markdown("### Navigation")
st.sidebar.page_link("app.py", label="Home")
st.sidebar.page_link("pages/student_chat.py", label="Student Chat")
st.sidebar.page_link("pages/admin_panel.py", label="Admin Panel")

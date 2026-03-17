import os
import sys
import streamlit as st

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

st.set_page_config(
    page_title="EduAgent AI - Student Chat",
    page_icon="EA",
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_resource
def startup_llm():
    from start_llm import initialize_llm

    return initialize_llm()


@st.cache_resource
def initialize_agents():
    try:
        from agents.query_agent import QueryUnderstandingAgent
        from agents.retrieval_agent import InformationRetrievalAgent
        from agents.response_agent import ResponseGenerationAgent
        from agents.escalation_agent import EscalationAgent

        q_agent = QueryUnderstandingAgent()
        r_agent = InformationRetrievalAgent()
        resp_agent = ResponseGenerationAgent()
        esc_agent = EscalationAgent()

        return q_agent, r_agent, resp_agent, esc_agent, True
    except Exception as exc:
        return None, None, None, None, str(exc)


llm_status = startup_llm()
query_agent, retrieval_agent, response_agent, escalation_agent, agents_ready = initialize_agents()

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'DM Sans', sans-serif;
    }

    .stApp {
        background: radial-gradient(circle at top left, #fff8e1 0%, #fff9f0 50%, #fdf2f5 100%);
    }

    .chat-hero {
        background: linear-gradient(135deg, #6b1d3a 0%, #9e3a5e 100%);
        padding: 22px;
        border-radius: 16px;
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 12px 28px rgba(61, 15, 35, 0.22);
        margin-bottom: 16px;
    }

    .chat-hero h1 {
        margin: 0;
        font-size: 1.9rem;
        font-weight: 700;
    }

    .chat-hero p {
        margin: 6px 0 0;
        color: #f8e7ee;
        font-size: 0.98rem;
    }

    .status-box {
        background: #ffffff;
        border: 1px solid #f0b8c8;
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 10px;
        box-shadow: 0 4px 10px rgba(84, 21, 48, 0.06);
    }

    .quick-q-title {
        color: #3d0f23;
        font-weight: 700;
        margin-top: 14px;
    }

    .agent-log-item {
        font-size: 12px;
        color: #334155;
        padding: 6px 8px;
        border-left: 3px solid #9e3a5e;
        margin: 4px 0;
        background: #fff3e0;
        border-radius: 0 6px 6px 0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": (
                "Hello! I am EduAgent AI. Ask me about exams, fees, attendance, scholarships, admissions, and policies."
            ),
        }
    ]

if "agent_log" not in st.session_state:
    st.session_state.agent_log = []


def run_pipeline(prompt: str) -> str:
    if not llm_status.get("ready"):
        return (
            "The local AI model is not running. Start Ollama with `ollama serve`, then refresh this page."
        )

    if agents_ready is not True:
        return f"System initialization error: {agents_ready}"

    status_text = st.empty()

    try:
        status_text.caption("Escalation Agent: checking query sensitivity...")
        escalation_result = escalation_agent.process(prompt)
        st.session_state.agent_log.append("Escalation Agent: query checked")

        if escalation_result["escalated"]:
            status_text.empty()
            st.session_state.agent_log.append("Query escalated to admin staff")
            return escalation_result["message"]

        status_text.caption("Query Agent: analyzing your question...")
        query_analysis = query_agent.analyze(prompt)
        st.session_state.agent_log.append(
            f"Query Agent: category = {query_analysis['category']}"
        )

        status_text.caption("Retrieval Agent: searching database and PDF context...")
        retrieved_data = retrieval_agent.retrieve(query_analysis)
        faq_count = len(retrieved_data.get("faqs", []))
        has_pdf = bool(retrieved_data.get("pdf_context"))
        st.session_state.agent_log.append(
            f"Retrieval Agent: {faq_count} FAQs | PDF context: {'yes' if has_pdf else 'no'}"
        )

        status_text.caption("Response Agent: generating response with phi3:mini...")
        response_text = response_agent.generate(prompt, retrieved_data)
        st.session_state.agent_log.append("Response Agent: answer generated")
        status_text.empty()
        return response_text

    except Exception as exc:
        status_text.empty()
        st.session_state.agent_log.append(f"Error: {str(exc)[:80]}")
        return f"Something went wrong: {exc}"


with st.sidebar:
    st.markdown("## EduAgent AI")
    st.markdown("### Navigation")
    st.page_link("app.py", label="Home")
    st.page_link("pages/student_chat.py", label="Student Chat")
    st.page_link("pages/admin_panel.py", label="Admin Panel")

    st.markdown("---")
    st.markdown("### Local AI Status")
    if llm_status.get("ready"):
        st.success("phi3:mini is online")
    else:
        st.error("LLM is offline")
        st.caption(llm_status.get("message", "Unknown error"))

    st.markdown("---")
    st.markdown("### Agent Activity")
    if st.session_state.agent_log:
        for log in st.session_state.agent_log[-8:]:
            st.markdown(f'<div class="agent-log-item">{log}</div>', unsafe_allow_html=True)
    else:
        st.caption("Activity appears as students chat.")

st.markdown(
    """
    <div class="chat-hero">
      <h1>Student Chat</h1>
      <p>Ask academic questions and get responses from your existing multi-agent backend.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

row_left, row_right = st.columns([3, 1])
with row_left:
    st.markdown('<div class="status-box"><b>Mode:</b> Student Assistant</div>', unsafe_allow_html=True)
with row_right:
    if st.button("Open Admin Panel", use_container_width=True):
        st.switch_page("pages/admin_panel.py")

if not llm_status.get("ready"):
    st.warning("Local model is not ready. Run `ollama serve` and refresh.")

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

st.markdown('<p class="quick-q-title">Quick Questions</p>', unsafe_allow_html=True)
q1, q2, q3, q4 = st.columns(4)
selected_prompt = None

with q1:
    if st.button("Exam Schedule", use_container_width=True):
        selected_prompt = "When are the upcoming semester exams?"
with q2:
    if st.button("Fee Structure", use_container_width=True):
        selected_prompt = "What is the complete fee structure?"
with q3:
    if st.button("Attendance", use_container_width=True):
        selected_prompt = "What is the minimum attendance requirement?"
with q4:
    if st.button("Scholarships", use_container_width=True):
        selected_prompt = "What scholarships are available for students?"

chat_prompt = st.chat_input("Ask your academic question here...")
prompt = chat_prompt or selected_prompt

if prompt:
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        answer = run_pipeline(prompt)
        st.markdown(answer)

    st.session_state.messages.append({"role": "assistant", "content": answer})

if st.button("Clear Chat History"):
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "Hello! I am EduAgent AI. How can I help you today?",
        }
    ]
    st.session_state.agent_log = []
    st.rerun()

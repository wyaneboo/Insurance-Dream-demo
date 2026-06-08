"""Dream AI Assistant — LangGraph agent service.

This package holds the agent "brain" (planning, evaluation, repair, finalize)
and the Gemini calls. All database work and auth scoping stay in the Node
backend; the `tool` node calls back into Node over an internal HTTP endpoint.
"""

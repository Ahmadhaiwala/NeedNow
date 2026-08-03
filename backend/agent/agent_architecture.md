                PostgreSQL
                    │
          get_user_context()
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼

Preferences Interactions Purchases
│
▼
Context Analyzer
│
embeddings + weights
│
▼
┌─────────────────────┐
│ Active interests │
│ Possible projects │
│ Purchase patterns │
│ Confidence │
└──────────┬──────────┘
▼
LLM Agent
│
▼
Agent Tools
│
▼
Recommendation
Engine

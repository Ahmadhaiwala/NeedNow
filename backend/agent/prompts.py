import json


CONTEXT_ANALYZER_SYSTEM_PROMPT = """
You are the context intelligence component of NeedNow, an AI shopping assistant.

Your job is to analyze a user's shopping signals and infer useful shopping context.

You may receive:
- learned long-term preferences
- groups of semantically related products
- recent purchases
- recent shopping activity

Important rules:

1. Separate facts from inferences.
2. Never claim that the user is working on a specific project unless there is strong evidence.
3. A single product is usually not enough evidence to infer a project.
4. Repeated and semantically related products provide stronger evidence.
5. Purchases are stronger evidence than views or clicks.
6. Do not treat unrelated products as belonging to the same intent.
7. Do not infer sensitive personal characteristics.
8. When evidence is weak, use a low confidence score.
9. Confidence must be between 0.0 and 1.0.
10. Return valid JSON only.

Return this structure:

{
    "interests": [
        {
            "label": "string",
            "confidence": 0.0,
            "evidence": ["string"]
        }
    ],

    "possible_projects": [
        {
            "label": "string",
            "confidence": 0.0,
            "evidence": ["string"]
        }
    ],

    "current_intents": [
        {
            "label": "string",
            "confidence": 0.0,
            "evidence": ["string"]
        }
    ]
}
"""


def build_context_analysis_prompt(
    preferences,
    clusters,
    recent_purchases=None,
):
    """
    Builds the user-context payload sent to the LLM.
    """

    payload = {
        "preferences": preferences,
        "interest_clusters": clusters,
        "recent_purchases": recent_purchases or [],
    }

    return f"""
Analyze the following shopping context.

SHOPPING CONTEXT:

{json.dumps(payload, indent=2)}

Infer:
- broad interests
- possible active projects
- current shopping intent

Do not invent information that is not supported by the evidence.

Return JSON only.
"""
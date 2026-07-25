import json

from agent.llm import (
    call_llm_with_tools,
    analyze_user_context,
)

from agent.tools import (
    hybrid_search_products,
    get_product_details,
)
from agent.tool_schemas import AGENT_TOOLS


AGENT_SYSTEM_PROMPT = """
You are NeedNow's intelligent shopping assistant.

Your job is to help users discover products that match their
current needs while taking their shopping context into account.

You have access to tools that search the NeedNow product catalog.

Rules:

1. Use product search when the user is asking for products,
   recommendations, alternatives, accessories, or something
   they may need to buy.

2. Do not invent products, prices, ratings, availability,
   specifications, or other catalog information.

3. When recommending catalog products, base recommendations
   on tool results.

4. User context represents inferred preferences and shopping
   patterns. Treat these as signals, not absolute facts.

5. Prefer the user's current request over historical preferences.

6. If historical context is relevant, use it to improve
   recommendations.

7. Do not force personalization when it is unrelated to the
   current request.

8. Be concise and useful.

9. If no suitable product is found, say so rather than
   inventing one.

10. Do not assume that purchasing a product is necessarily
    the solution to the user's problem. When appropriate,
    briefly explain relevant checks or conditions before
    recommending a purchase.

11. When compatibility matters, do not claim that a product
    is compatible unless the available product information
    supports that conclusion. Ask the user for required
    compatibility details when necessary.
"""


def execute_tool(tool_name, arguments):
    """
    Execute an agent tool requested by the LLM.
    """

    if tool_name == "search_products":

        query = arguments.get("query", "")
        limit = arguments.get("limit", 5)

        return hybrid_search_products(
            query=query,
            limit=limit,
        )

    if tool_name == "get_product_details":

        product_id = arguments.get("product_id")

        return get_product_details(
            product_id=product_id,
        )

    raise ValueError(
        f"Unknown agent tool: {tool_name}"
    )


def run_agent(user, message):
    """
    Main NeedNow agent loop.
    """

    # ----------------------------------
    # 1. Understand the user's history
    # ----------------------------------

    user_context = analyze_user_context(user)

    context_text = json.dumps(
        user_context,
        indent=2,
    )

    # ----------------------------------
    # 2. Initial conversation
    # ----------------------------------

    context_text = json.dumps(
    user_context,
    indent=2,
)

    system_content = f"""
    {AGENT_SYSTEM_PROMPT}

    USER SHOPPING CONTEXT:

    The following context is inferred from the user's shopping
    history and behavior.

    Treat it as supporting context, not guaranteed fact.
    The user's current request always has priority.

    {context_text}
    """

    messages = [
        {
            "role": "system",
            "content": system_content,
        },
        {
            "role": "user",
            "content": message,
        },
    ]

    # ----------------------------------
    # 3. Let LLM decide what to do
    # ----------------------------------

    assistant_message = call_llm_with_tools(
        messages=messages,
        tools=AGENT_TOOLS,
    )

    print("\n===== FIRST LLM MESSAGE =====")
    print(json.dumps(assistant_message, indent=2, default=str))
    print("=============================\n")
    

    messages.append(assistant_message)

    # ----------------------------------
    # 4. Execute requested tools
    # ----------------------------------

    tool_calls = assistant_message.get(
        "tool_calls",
        [],
    )

    if not tool_calls:
        return assistant_message.get(
            "content",
            "",
        )

    for tool_call in tool_calls:

        function = tool_call["function"]

        tool_name = function["name"]

        try:
            arguments = json.loads(
                function.get(
                    "arguments",
                    "{}",
                )
            )

        except json.JSONDecodeError:
            arguments = {}

        result = execute_tool(
            tool_name,
            arguments,
        )

        messages.append(
            {
                "role": "tool",
                "tool_call_id": tool_call["id"],
                "name": tool_name,
                "content": json.dumps(
                    result,
                    default=str,
                ),
            }
        )

    # ----------------------------------
    # 5. Give results back to LLM
    # ----------------------------------

    final_message = call_llm_with_tools(
        messages=messages,
        tools=AGENT_TOOLS,
    )
    print("\n===== FINAL MESSAGE =====")
    print(json.dumps(final_message, indent=2, default=str))
    print("=========================\n")

    return final_message.get("content") or ""
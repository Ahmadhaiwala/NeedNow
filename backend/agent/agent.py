import json
import logging

from agent.llm import (
    call_llm_with_tools,
    stream_llm_with_tools,
    analyze_user_context,
)

logger = logging.getLogger(__name__)


from agent.models import ChatMessage
from agent.tools import (
    _is_authenticated_user,
    hybrid_search_products,
    get_product_details,
    compare_products,
    get_recommendations,
    get_cart,
    add_to_cart,
    get_recent_orders,
    get_order_status,
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


def execute_tool(tool_name, arguments, user=None):
    """
    Execute an agent tool requested by the LLM.

    The authenticated user context is injected by the backend dispatcher,
    never trusted from model arguments.
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

    if tool_name == "compare_products":

        product_ids = arguments.get("product_ids", [])

        return compare_products(
            product_ids=product_ids,
        )

    if tool_name == "get_recommendations":

        limit = arguments.get("limit", 5)

        return get_recommendations(
            user=user,
            limit=limit,
        )

    if tool_name == "get_cart":

        return get_cart(
            user=user,
        )

    if tool_name == "add_to_cart":

        product_id = arguments.get("product_id")
        quantity = arguments.get("quantity", 1)

        return add_to_cart(
            user=user,
            product_id=product_id,
            quantity=quantity,
        )

    if tool_name == "get_recent_orders":

        limit = arguments.get("limit", 5)

        return get_recent_orders(
            user=user,
            limit=limit,
        )

    if tool_name == "get_order_status":

        order_id = arguments.get("order_id")

        return get_order_status(
            user=user,
            order_id=order_id,
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
            user=user,
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


TOOL_STATUS_MESSAGES = {
    "search_products": "Searching products...",
    "get_product_details": "Checking product details...",
    "compare_products": "Comparing products...",
    "get_recommendations": "Finding recommendations for you...",
    "get_cart": "Checking your cart...",
    "add_to_cart": "Updating your cart...",
    "get_recent_orders": "Checking your recent orders...",
    "get_order_status": "Checking your order...",
}


def stream_event(event):
    """
    Format a dictionary as a newline-delimited JSON string event.
    """
    return json.dumps(event) + "\n"


def run_agent_stream(user, message):
    """
    Streaming NeedNow agent pipeline generator.
    Yields NDJSON strings: json.dumps(event) + "\n"
    """
    try:
        # ----------------------------------
        # 1. Understand user context
        # ----------------------------------
        user_context = analyze_user_context(user)
        context_text = json.dumps(user_context, indent=2)

        system_content = f"""
{AGENT_SYSTEM_PROMPT}

USER SHOPPING CONTEXT:

The following context is inferred from the user's shopping
history and behavior.

Treat it as supporting context, not guaranteed fact.
The user's current request always has priority.

{context_text}
"""

        # Retrieve up to 5 recent historical chat messages for model context
        history_messages = []
        if _is_authenticated_user(user):
            recent_qs = (
                ChatMessage.objects
                .filter(user=user)
                .order_by("-created_at")[:5]
            )
            for h in reversed(list(recent_qs)):
                history_messages.append({
                    "role": h.role,
                    "content": h.content,
                })

            # Save incoming user message
            ChatMessage.objects.create(
                user=user,
                role=ChatMessage.Role.USER,
                content=message,
            )

        messages = [
            {"role": "system", "content": system_content},
            *history_messages,
            {"role": "user", "content": message},
        ]

        max_iterations = 5
        full_assistant_response = ""

        for _iteration in range(max_iterations):
            assistant_message = None

            # Stream OpenRouter assistant turn
            for chunk in stream_llm_with_tools(messages=messages, tools=AGENT_TOOLS):
                chunk_type = chunk.get("type")

                if chunk_type == "content":
                    full_assistant_response += chunk["content"]
                    yield stream_event({"type": "token", "content": chunk["content"]})

                elif chunk_type == "message_complete":
                    assistant_message = chunk["message"]

            if not assistant_message:
                break

            messages.append(assistant_message)

            tool_calls = assistant_message.get("tool_calls", [])
            if not tool_calls:
                # Turn completed without tool calls (final answer completed)
                break

            # Execute tool calls
            for tool_call in tool_calls:
                function_data = tool_call.get("function", {})
                tool_name = function_data.get("name", "")

                status_msg = TOOL_STATUS_MESSAGES.get(
                    tool_name, f"Executing {tool_name}..."
                )
                yield stream_event({"type": "status", "message": status_msg})

                raw_args = function_data.get("arguments", "{}")
                try:
                    arguments = json.loads(raw_args) if raw_args else {}
                except json.JSONDecodeError:
                    arguments = {}

                result = execute_tool(
                    tool_name=tool_name,
                    arguments=arguments,
                    user=user,
                )

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.get("id", ""),
                        "name": tool_name,
                        "content": json.dumps(result, default=str),
                    }
                )

        # Save assistant response to chat history
        if _is_authenticated_user(user) and full_assistant_response.strip():
            ChatMessage.objects.create(
                user=user,
                role=ChatMessage.Role.ASSISTANT,
                content=full_assistant_response.strip(),
            )

        yield stream_event({"type": "done"})

    except Exception as exc:
        logger.exception("Agent streaming failed for user=%s: %s", getattr(user, "pk", None), exc)
        yield stream_event({"type": "error", "message": "Unable to generate response."})

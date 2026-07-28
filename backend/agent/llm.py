import json

from agent.context import get_user_context
from agent.context_analyzer import (
    build_interest_signals,
    group_related_interests,
)
from agent.prompts import (
    CONTEXT_ANALYZER_SYSTEM_PROMPT,
    build_context_analysis_prompt,
)


import os
import requests
def call_llm_with_tools(
    messages,
    tools=None,
    model="qwen/qwen3.5-9b",
    temperature=0.3,
):
    """
    Call OpenRouter with optional tool/function calling support.

    Returns the complete assistant message because the caller
    needs access to both `content` and `tool_calls`.
    """

    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY environment variable not set."
        )

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=60,
        )
        if not response.ok:
            raise RuntimeError(
                f"OpenRouter request failed "
                f"[{response.status_code}]: {response.text}"
            )
        data = response.json()

    except requests.RequestException as exc:
        raise RuntimeError(
            f"OpenRouter request failed: {exc}"
        ) from exc

    data = response.json()

    try:
        return data["choices"][0]["message"]

    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(
            f"Unexpected OpenRouter response: {data}"
        ) from exc
def call_llm(
    system_prompt,
    user_prompt,
    #~google/gemini-flash-latest
    model="openrouter/free",
):
    """
    Call an LLM through OpenRouter.
    """

    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY environment variable not set."
        )

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,

        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],

        # Context analysis should be fairly deterministic
        "temperature": 0.2,

        # We expect JSON
        "response_format": {
            "type": "json_object"
        },
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30,
        )

        response.raise_for_status()

    except requests.RequestException as exc:
        raise RuntimeError(
            f"OpenRouter request failed: {exc}"
        ) from exc

    data = response.json()

    try:
        return data["choices"][0]["message"]["content"]

    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(
            f"Unexpected OpenRouter response: {data}"
        ) from exc


def parse_llm_json(response_text):
    """
    Parse and validate the basic structure of the LLM response.
    """

    response_text = response_text.strip()

    # Some models may still wrap JSON in markdown fences.
    if response_text.startswith("```"):
        response_text = response_text.replace("```json", "")
        response_text = response_text.replace("```", "")
        response_text = response_text.strip()

    try:
        data = json.loads(response_text)

    except json.JSONDecodeError as exc:
        raise ValueError(
            "LLM returned invalid JSON."
        ) from exc

    required_keys = {
        "interests",
        "possible_projects",
        "current_intents",
    }

    missing = required_keys - data.keys()

    if missing:
        raise ValueError(
            f"LLM response missing fields: {missing}"
        )

    return data


def analyze_user_context(user):
    """
    Full user-context intelligence pipeline.

    User
      -> raw context
      -> weighted signals
      -> semantic clusters
      -> LLM inference
      -> structured context
    """

    # 1. Retrieve raw context
    context = get_user_context(user)

    # 2. Build weighted signals
    signals = build_interest_signals(context)

    # 3. Semantic grouping
    clusters = group_related_interests(signals)

    # 4. Build LLM prompt
    user_prompt = build_context_analysis_prompt(
        preferences=context["preferences"],
        clusters=clusters,
        recent_purchases=context["recent_purchases"],
    )

    # 5. Call LLM
    response_text = call_llm(
        system_prompt=CONTEXT_ANALYZER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
    )

    # 6. Convert response into Python dict
    analysis = parse_llm_json(response_text)

    return analysis


def stream_llm_with_tools(
    messages,
    tools=None,
    model="qwen/qwen3.5-9b",
    temperature=0.3,
):
    """
    Call OpenRouter with streaming enabled (stream=True) and tool/function calling support.

    Yields dictionaries representing content tokens or the completed assistant message object.
    Content token yield format: {"type": "content", "content": "token_str"}
    Message complete yield format: {"type": "message_complete", "message": assistant_message_dict}
    """
    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set.")

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "stream": True,
    }

    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            stream=True,
            timeout=60,
        )
        if not response.ok:
            raise RuntimeError(
                f"OpenRouter streaming request failed [{response.status_code}]: {response.text}"
            )

        accumulated_content = ""
        accumulated_tool_calls = {}

        for line in response.iter_lines():
            if not line:
                continue

            line_str = line.decode("utf-8").strip()
            if not line_str.startswith("data:"):
                continue

            data_str = line_str[5:].strip()
            if data_str == "[DONE]":
                break

            try:
                chunk = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            choices = chunk.get("choices", [])
            if not choices:
                continue

            delta = choices[0].get("delta", {})

            # Stream content tokens
            content_piece = delta.get("content")
            if content_piece:
                accumulated_content += content_piece
                yield {"type": "content", "content": content_piece}

            # Accumulate tool call deltas across chunks
            tool_calls_delta = delta.get("tool_calls", [])
            for tc_delta in tool_calls_delta:
                idx = tc_delta.get("index", 0)
                if idx not in accumulated_tool_calls:
                    accumulated_tool_calls[idx] = {
                        "id": "",
                        "type": "function",
                        "function": {"name": "", "arguments": ""},
                    }

                if tc_delta.get("id"):
                    accumulated_tool_calls[idx]["id"] += tc_delta["id"]

                fn_delta = tc_delta.get("function", {})
                if fn_delta.get("name"):
                    accumulated_tool_calls[idx]["function"]["name"] += fn_delta["name"]

                if fn_delta.get("arguments"):
                    accumulated_tool_calls[idx]["function"]["arguments"] += fn_delta["arguments"]

        # Reconstruct final assistant message structure
        final_tool_calls = [
            accumulated_tool_calls[i]
            for i in sorted(accumulated_tool_calls.keys())
        ] if accumulated_tool_calls else None

        assistant_message = {
            "role": "assistant",
            "content": accumulated_content if accumulated_content else None,
        }
        if final_tool_calls:
            assistant_message["tool_calls"] = final_tool_calls

        yield {"type": "message_complete", "message": assistant_message}

    except requests.RequestException as exc:
        raise RuntimeError(f"OpenRouter request failed: {exc}") from exc
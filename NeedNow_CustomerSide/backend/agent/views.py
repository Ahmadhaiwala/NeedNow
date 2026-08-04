import logging
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from users.auth_utils import get_user_from_neon_auth
from agent.agent import run_agent_stream

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def agent_chat(request):
    """
    POST /api/agent/chat/

    Stream response from the NeedNow agent as newline-delimited JSON (NDJSON).
    Requires a valid Neon Auth JWT header or authenticated session.

    Request body:
    {
        "message": "My CPU is overheating. What should I buy?"
    }

    Response:
    StreamingHttpResponse (application/x-ndjson) yielding events:
    - {"type": "status", "message": "..."}
    - {"type": "token", "content": "..."}
    - {"type": "done"}
    - {"type": "error", "message": "..."}
    """
    user = get_user_from_neon_auth(request)
    if not user and getattr(request.user, "is_authenticated", False):
        user = request.user

    if not user:
        return Response(
            {"error": "Authentication required. Please sign in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    data = request.data
    message = data.get("message") if isinstance(data, dict) else None

    if not message or not isinstance(message, str) or not message.strip():
        return Response(
            {"error": "A non-empty 'message' string is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def event_stream():
        yield from run_agent_stream(user=user, message=message.strip())

    response = StreamingHttpResponse(
        event_stream(),
        content_type="application/x-ndjson",
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


from agent.models import ChatMessage


@api_view(["GET"])
@permission_classes([AllowAny])
def agent_history(request):
    """
    GET /api/agent/history/

    Retrieve historical chat messages for the authenticated user.
    """
    user = get_user_from_neon_auth(request)
    if not user and getattr(request.user, "is_authenticated", False):
        user = request.user

    if not user:
        return Response(
            {"error": "Authentication required. Please sign in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    messages = (
        ChatMessage.objects
        .filter(user=user)
        .order_by("created_at")[:50]
    )

    data = [
        {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in messages
    ]

    return Response({"messages": data, "count": len(data)})


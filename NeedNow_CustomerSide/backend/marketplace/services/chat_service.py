from typing import Any, Dict, List, Optional
from django.db import models
from django.db.models import Q
from django.core.exceptions import ValidationError, PermissionDenied

from ..models import MarketplacePost, ChatMessage
from .utils import get_instance, get_user


class ChatService:
    """
    Service handling Marketplace Chat logic.
    """

    @classmethod
    def send_message(
        cls,
        sender: Any,
        recipient_or_id: Any,
        post_or_id: Optional[Any] = None,
        content: str = '',
        image: Any = None
    ) -> ChatMessage:
        """
        Sends a chat message to recipient regarding a marketplace post.
        """
        sender_obj = get_user(sender)
        recipient_obj = get_user(recipient_or_id)

        if sender_obj == recipient_obj:
            raise ValidationError("You cannot send a message to yourself.")

        if not content and not image:
            raise ValidationError("Message must contain either text content or an image attachment.")

        post_obj = get_instance(MarketplacePost, post_or_id) if post_or_id else None

        message = ChatMessage.objects.create(
            sender=sender_obj,
            recipient=recipient_obj,
            post=post_obj,
            content=content,
            image=image,
            is_read=False
        )

        return ChatMessage.objects.select_related(
            'sender', 'sender__marketplace_profile',
            'recipient', 'recipient__marketplace_profile',
            'post'
        ).get(id=message.id)

    @classmethod
    def get_chat_messages(
        cls,
        user: Any,
        other_user_or_id: Any,
        post_or_id: Optional[Any] = None
    ) -> models.QuerySet:
        """
        Retrieves chronological chat conversation between user and another user, marking received messages read.
        """
        user_obj = get_user(user)
        other_user = get_user(other_user_or_id)

        queryset = ChatMessage.objects.select_related(
            'sender', 'sender__marketplace_profile',
            'recipient', 'recipient__marketplace_profile',
            'post'
        ).filter(
            (Q(sender=user_obj) & Q(recipient=other_user)) |
            (Q(sender=other_user) & Q(recipient=user_obj))
        )

        if post_or_id:
            post_obj = get_instance(MarketplacePost, post_or_id)
            queryset = queryset.filter(post=post_obj)

        unread_ids = list(queryset.filter(recipient=user_obj, is_read=False).values_list('id', flat=True))
        if unread_ids:
            ChatMessage.objects.filter(id__in=unread_ids).update(is_read=True)

        return queryset.order_by('created_at')

    @classmethod
    def get_chat_list(cls, user: Any) -> List[Dict[str, Any]]:
        """
        Retrieves distinct chat conversations for user with latest message snippet and unread count.
        """
        user_obj = get_user(user)

        messages = ChatMessage.objects.select_related(
            'sender', 'sender__marketplace_profile',
            'recipient', 'recipient__marketplace_profile',
            'post'
        ).filter(
            Q(sender=user_obj) | Q(recipient=user_obj)
        ).order_by('-created_at')

        conversations = {}
        for msg in messages:
            other_user = msg.recipient if msg.sender == user_obj else msg.sender
            key = (other_user.id, msg.post_id)

            if key not in conversations:
                unread_count = ChatMessage.objects.filter(
                    sender=other_user,
                    recipient=user_obj,
                    post_id=msg.post_id,
                    is_read=False
                ).count()

                conversations[key] = {
                    'other_user': other_user,
                    'post': msg.post,
                    'latest_message': msg,
                    'unread_count': unread_count,
                    'last_updated': msg.created_at
                }

        return list(conversations.values())

    @classmethod
    def mark_messages_read(cls, user: Any, sender_or_id: Any, post_or_id: Optional[Any] = None) -> int:
        """
        Marks all unread messages received by user from sender (optionally on post) as read.
        """
        user_obj = get_user(user)
        sender_obj = get_user(sender_or_id)

        queryset = ChatMessage.objects.filter(
            recipient=user_obj,
            sender=sender_obj,
            is_read=False
        )

        if post_or_id:
            post_obj = get_instance(MarketplacePost, post_or_id)
            queryset = queryset.filter(post=post_obj)

        return queryset.update(is_read=True)

    @classmethod
    def delete_message(cls, message_or_id: Any, user: Any) -> bool:
        """
        Deletes a chat message after checking user participation.
        """
        user_obj = get_user(user)
        message = get_instance(ChatMessage, message_or_id)

        if message.sender != user_obj and message.recipient != user_obj:
            raise PermissionDenied("You do not have permission to delete this message.")

        message.delete()
        return True

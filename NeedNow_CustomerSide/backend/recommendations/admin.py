from django.contrib import admin
from .models import UserInteraction, UserPreference


@admin.register(UserInteraction)
class UserInteractionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "product", "interaction_type", "value", "created_at"]
    list_filter = ["interaction_type", "created_at"]
    search_fields = ["user__email", "product__name"]
    readonly_fields = ["created_at"]
    ordering = ["-created_at"]


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "updated_at"]
    search_fields = ["user__email"]
    readonly_fields = ["updated_at"]

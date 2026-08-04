from django.contrib import admin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        'display_name', 'email', 'username', 'is_active', 'created_at'
    ]
    list_filter = [
        'is_active', 'created_at', 'updated_at'
    ]
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'email', 'first_name', 'last_name', 'username')
        }),
        ('Profile', {
            'fields': ('profile_image_url',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def profile_image_preview(self, obj):
        if obj.profile_image_url:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; border-radius: 50%;">',
                obj.profile_image_url
            )
        return "No image"
    profile_image_preview.short_description = "Profile Image"


# Custom admin site configuration
admin.site.site_header = "NeedNow Admin"
admin.site.site_title = "NeedNow Admin Portal"
admin.site.index_title = "Welcome to NeedNow Administration"
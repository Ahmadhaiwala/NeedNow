"""
Management command: rebuild_preferences
=======================================

Backfills / rebuilds UserPreference records from historical UserInteraction data.

Usage::

    # Rebuild preferences for ALL users with interactions
    python manage.py rebuild_preferences

    # Rebuild a single user
    python manage.py rebuild_preferences --user-id <uuid>

    # Control memory usage with batch-size (default 200 users/batch)
    python manage.py rebuild_preferences --batch-size 100
"""

from django.core.management.base import BaseCommand, CommandError

from recommendations.services.preference_services import PreferenceService
from users.models import User


class Command(BaseCommand):
    help = (
        "Rebuild UserPreference records from historical UserInteraction data. "
        "Use this for initial backfill, config changes, or data recovery."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=str,
            default=None,
            metavar="UUID",
            help="Rebuild preferences for a single user by UUID. Omit to rebuild all users.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=200,
            metavar="N",
            help="Number of users per processing batch when rebuilding all (default: 200).",
        )

    def handle(self, *args, **options):
        service = PreferenceService()
        user_id = options["user_id"]
        batch_size = options["batch_size"]

        if batch_size < 1:
            raise CommandError("--batch-size must be a positive integer.")

        if user_id:
            # ---------------------------------------------------------------- #
            # Single-user mode                                                   #
            # ---------------------------------------------------------------- #
            self.stdout.write(
                self.style.MIGRATE_HEADING(f"Rebuilding preferences for user: {user_id}")
            )
            try:
                user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                raise CommandError(f"No user found with id='{user_id}'.")

            pref = service.rebuild_user_preferences(user)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Done!\n"
                    f"  Categories: {len(pref.category_scores)} entries\n"
                    f"  Brands:     {len(pref.brand_scores)} entries\n"
                    f"  Tags:       {len(pref.tag_scores)} entries\n"
                    f"  Calculated at: {pref.last_calculated_at}"
                )
            )
        else:
            # ---------------------------------------------------------------- #
            # All-users mode                                                     #
            # ---------------------------------------------------------------- #
            self.stdout.write(
                self.style.MIGRATE_HEADING(
                    f"Rebuilding preferences for ALL users (batch_size={batch_size})..."
                )
            )
            total = service.rebuild_all_user_preferences(batch_size=batch_size)
            self.stdout.write(
                self.style.SUCCESS(f"Done! Processed {total} user(s).")
            )

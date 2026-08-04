from django.core.management.base import BaseCommand
# pyrefly: ignore [missing-import]
from recommendations.services.embedding_service import (
    ProductEmbeddingService,
    UserEmbeddingService,
)


class Command(BaseCommand):
    help = "Generate and persist embeddings for all products and users."

    def add_arguments(self, parser):
        parser.add_argument(
            "--products-only",
            action="store_true",
            help="Only embed products, skip users.",
        )
        parser.add_argument(
            "--users-only",
            action="store_true",
            help="Only embed users, skip products.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=64,
            help="Number of items per encoding batch (default 64).",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]

        if not options["users_only"]:
            self.stdout.write(self.style.MIGRATE_HEADING("Embedding products..."))
            prod_svc = ProductEmbeddingService()
            saved = prod_svc.embed_all_products(batch_size=batch_size)
            self.stdout.write(self.style.SUCCESS(f"  Products embedded: {saved}"))

        if not options["products_only"]:
            self.stdout.write(self.style.MIGRATE_HEADING("Embedding users..."))
            user_svc = UserEmbeddingService()
            saved = user_svc.embed_all_users(batch_size=batch_size)
            self.stdout.write(self.style.SUCCESS(f"  Users embedded: {saved}"))

        self.stdout.write(self.style.SUCCESS("Done!"))

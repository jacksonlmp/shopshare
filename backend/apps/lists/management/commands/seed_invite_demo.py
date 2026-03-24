"""
Cria utilizador + lista de demo com código partilhável fixo (testes locais / convite por link).

Uso:
  docker compose run --rm backend python manage.py seed_invite_demo
"""

from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.lists.models import ListMember, ShoppingList
from apps.users.models import User

# UUID estável para não duplicar o mesmo “seed” em corridas repetidas
SEED_USER_ID = "00000000-0000-4000-8000-000000000001"
SEED_SHARE_CODE = "INVITE"
SEED_DESCRIPTION = "Lista para carnes, bebidas e acompanhamentos do churrasco (seed local)."


class Command(BaseCommand):
    help = "Garante lista de demo com share_code INVITE (convite /invite/INVITE)."

    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(
            pk=SEED_USER_ID,
            defaults={
                "display_name": "Demo Seed",
                "avatar_emoji": "🌱",
            },
        )

        lst, created = ShoppingList.objects.get_or_create(
            share_code=SEED_SHARE_CODE,
            defaults={
                "owner_id": user.pk,
                "name": "Churrasco de domingo (demo)",
                "description": SEED_DESCRIPTION,
            },
        )
        if lst.description != SEED_DESCRIPTION:
            lst.description = SEED_DESCRIPTION
            lst.save()

        ListMember.objects.get_or_create(
            list=lst,
            user_id=user.pk,
            defaults={"role": ListMember.ROLE_OWNER},
        )

        status = "criada" if created else "já existia"
        self.stdout.write(self.style.SUCCESS(f"Lista demo ({status}): {lst.name} — código #{lst.share_code}"))

        self.stdout.write("")
        self.stdout.write("Abra no browser (Vite):")
        self.stdout.write(self.style.HTTP_INFO("  http://localhost:5173/invite/INVITE"))
        self.stdout.write("")
        self.stdout.write(
            "Com outro perfil: janela anónima ou apague localStorage do site, "
            "faça login e use «Entrar na lista» ou o mesmo link."
        )
        self.stdout.write("")
        self.stdout.write(f"User seed (X-User-Id para curl): {user.pk}")

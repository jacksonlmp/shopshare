from django.db import migrations

# Seis categorias fixas (PT-BR) — alinhadas ao modal Stitch / ShopShare.
_SPECS = (
    ("Frutas", "🍎", "#E53935"),
    ("Laticínios", "🥛", "#4DA3FF"),
    ("Carnes", "🥩", "#FF6B3D"),
    ("Limpeza", "🧹", "#2ED573"),
    ("Bebidas", "🥤", "#7E90FF"),
    ("Padaria", "🥖", "#C9A227"),
)

_OLD_EN_TO_PT = {
    "Fruits": "Frutas",
    "Dairy": "Laticínios",
    "Meat": "Carnes",
    "Cleaning": "Limpeza",
    "Drinks": "Bebidas",
    "Snacks": "Padaria",
}


def forwards(apps, schema_editor) -> None:
    Category = apps.get_model("items", "Category")
    spec_by_pt = {name: (emoji, hx) for name, emoji, hx in _SPECS}

    for old_name, pt_name in _OLD_EN_TO_PT.items():
        emoji, color_hex = spec_by_pt[pt_name]
        Category.objects.filter(name=old_name).update(
            name=pt_name,
            emoji=emoji,
            color_hex=color_hex,
        )

    for name, emoji, color_hex in _SPECS:
        row = Category.objects.filter(name=name).first()
        if row:
            Category.objects.filter(pk=row.pk).update(emoji=emoji, color_hex=color_hex)
        else:
            Category.objects.create(name=name, emoji=emoji, color_hex=color_hex)


def noop(apps, schema_editor) -> None:
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("items", "0005_alter_item_added_by_alter_item_checked_by"),
    ]

    operations = [
        migrations.RunPython(forwards, noop),
    ]

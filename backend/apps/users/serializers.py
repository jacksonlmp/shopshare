from rest_framework import serializers

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "display_name", "avatar_emoji", "created_at"]
        read_only_fields = ["id", "created_at"]

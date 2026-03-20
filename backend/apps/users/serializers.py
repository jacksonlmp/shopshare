from rest_framework import serializers

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "display_name", "avatar_emoji", "device_token", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {
            "device_token": {"required": False, "allow_blank": True},
        }

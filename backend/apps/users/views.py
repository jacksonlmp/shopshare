from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema

from apps.users.models import User
from apps.users.serializers import UserSerializer
from config.api_exceptions import MissingUserIdHeader
from config.identity import get_x_user_id


@extend_schema(
    summary="Create anonymous user",
    tags=["users"],
    request=UserSerializer,
    responses={201: UserSerializer},
)
class UserCreateView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    summary="Get current user",
    description="Returns the user identified by the `X-User-Id` header.",
    tags=["users"],
    parameters=[
        OpenApiParameter(
            name="X-User-Id",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.HEADER,
            required=True,
            description="UUID string of the user (same as `User.id`).",
        ),
    ],
    responses={200: UserSerializer},
)
class UserMeView(APIView):
    def get(self, request):
        user_id = get_x_user_id(request)
        if not user_id:
            raise MissingUserIdHeader()

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise NotFound(detail="User not found.") from None

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

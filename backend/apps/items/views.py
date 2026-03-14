from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.items.serializers import ItemSerializer


class ItemCreateView(APIView):
    def post(self, request):
        serializer = ItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

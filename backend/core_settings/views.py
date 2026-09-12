from rest_framework import views, permissions, status
from rest_framework.response import Response
from .models import LibrarySetting
from .serializers import LibrarySettingSerializer
from accounts.permissions import IsAdminUserRole

class LibrarySettingView(views.APIView):
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsAdminUserRole()]

    def get(self, request):
        settings = LibrarySetting.get_settings()
        serializer = LibrarySettingSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        settings = LibrarySetting.get_settings()
        serializer = LibrarySettingSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

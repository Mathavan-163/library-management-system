from rest_framework import status, views, permissions, generics
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.db.models import Q
from .models import User, StudentProfile, StaffProfile
from .permissions import IsAdminUserRole, IsStaffUserRole, IsStudentUserRole
from .serializers import (
    UserSerializer,
    StudentRegisterSerializer,
    LoginSerializer,
    StaffCreateUpdateSerializer,
    StudentDetailSerializer
)

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({
                'message': 'Registration successful.',
                'token': token.key,
                'user': user_data
            }, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({
                'message': 'Login successful.',
                'token': token.key,
                'user': user_data
            }, status=status.HTTP_200_OK)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class ProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        data = request.data
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.save()

        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            profile = user.student_profile
            profile.phone = data.get('phone', profile.phone)
            profile.department = data.get('department', profile.department)
            profile.save()
        elif user.role == 'STAFF' and hasattr(user, 'staff_profile'):
            profile = user.staff_profile
            profile.phone = data.get('phone', profile.phone)
            profile.department = data.get('department', profile.department)
            profile.save()

        return Response(UserSerializer(user).data)


class StudentListView(generics.ListAPIView):
    permission_classes = [IsStaffUserRole]
    serializer_class = StudentDetailSerializer

    def get_queryset(self):
        queryset = StudentProfile.objects.select_related('user').all().order_by('-created_at')
        search = self.request.query_params.get('search', '').strip()
        dept = self.request.query_params.get('department', '').strip()
        st_status = self.request.query_params.get('status', '').strip()

        if search:
            queryset = queryset.filter(
                Q(student_id__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search)
            )
        if dept:
            queryset = queryset.filter(department__iexact=dept)
        if st_status:
            queryset = queryset.filter(status=st_status)

        return queryset


class StudentDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsStaffUserRole]
    serializer_class = StudentDetailSerializer
    queryset = StudentProfile.objects.select_related('user').all()
    lookup_field = 'id'

    def patch(self, request, *args, **kwargs):
        # Admin or Staff can toggle status or department/phone
        profile = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['ACTIVE', 'INACTIVE']:
            profile.status = new_status
            profile.save()
            profile.user.is_active = (new_status == 'ACTIVE')
            profile.user.save()
        if 'department' in request.data:
            profile.department = request.data['department']
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        profile.save()
        return Response(StudentDetailSerializer(profile).data)


class StaffListCreateView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        staff_members = User.objects.filter(role='STAFF').select_related('staff_profile').order_by('-date_joined')
        search = request.query_params.get('search', '').strip()
        if search:
            staff_members = staff_members.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(staff_profile__staff_id__icontains=search)
            )
        data = UserSerializer(staff_members, many=True).data
        return Response(data)

    def post(self, request):
        serializer = StaffCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class StaffDetailView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request, pk):
        try:
            staff_user = User.objects.get(pk=pk, role='STAFF')
        except User.DoesNotExist:
            return Response({'error': 'Staff member not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(staff_user).data)

    def put(self, request, pk):
        try:
            staff_user = User.objects.get(pk=pk, role='STAFF')
        except User.DoesNotExist:
            return Response({'error': 'Staff member not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StaffCreateUpdateSerializer(data=request.data, context={'user_id': pk})
        if serializer.is_valid():
            serializer.update(staff_user, serializer.validated_data)
            return Response(UserSerializer(staff_user).data)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            staff_user = User.objects.get(pk=pk, role='STAFF')
        except User.DoesNotExist:
            return Response({'error': 'Staff member not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce rule: Staff cannot delete admin; cannot delete oneself
        if staff_user.is_superuser or staff_user.role == 'ADMIN':
            return Response({'error': 'Cannot delete an administrator.'}, status=status.HTTP_403_FORBIDDEN)
        if staff_user == request.user:
            return Response({'error': 'Cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        staff_user.delete()
        return Response({'message': 'Staff member deleted successfully.'}, status=status.HTTP_200_OK)


class StaffToggleStatusView(views.APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            staff_user = User.objects.get(pk=pk, role='STAFF')
        except User.DoesNotExist:
            return Response({'error': 'Staff member not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = StaffProfile.objects.get_or_create(user=staff_user)
        new_status = 'INACTIVE' if profile.status == 'ACTIVE' else 'ACTIVE'
        profile.status = new_status
        profile.save()
        staff_user.is_active = (new_status == 'ACTIVE')
        staff_user.save()

        return Response({
            'message': f"Staff account marked as {new_status}.",
            'status': new_status
        }, status=status.HTTP_200_OK)

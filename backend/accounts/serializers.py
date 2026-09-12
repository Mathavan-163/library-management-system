from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import transaction
from .models import User, StudentProfile, StaffProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ('id', 'student_id', 'phone', 'department', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'student_id', 'created_at', 'updated_at')


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ('id', 'staff_id', 'phone', 'department', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'staff_id', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    staff_profile = StaffProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'is_active', 'date_joined',
            'student_profile', 'staff_profile'
        )
        read_only_fields = ('id', 'role', 'date_joined', 'is_active')

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username


class StudentRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                role='STUDENT'
            )
            profile = StudentProfile.objects.create(
                user=user,
                phone=validated_data.get('phone', ''),
                department=validated_data.get('department', 'Computer Science'),
                status='ACTIVE'
            )
            return user


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username_or_email = data.get('username_or_email')
        password = data.get('password')

        if not username_or_email or not password:
            raise serializers.ValidationError("Both username/email and password are required.")

        user = None
        # Check if login with email or username
        if '@' in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            user = authenticate(username=username_or_email, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials. Please check your username/email and password.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated. Please contact the administrator.")

        # Check role-specific profile status
        if user.role == 'STUDENT' and hasattr(user, 'student_profile'):
            if user.student_profile.status != 'ACTIVE':
                raise serializers.ValidationError("Your student account is inactive. Please contact the library administrator.")
        elif user.role == 'STAFF' and hasattr(user, 'staff_profile'):
            if user.staff_profile.status != 'ACTIVE':
                raise serializers.ValidationError("Your staff account is inactive. Please contact the library administrator.")

        data['user'] = user
        return data


class StaffCreateUpdateSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=StaffProfile.STATUS_CHOICES, default='ACTIVE')

    def validate_username(self, value):
        user_id = self.context.get('user_id')
        qs = User.objects.filter(username__iexact=value)
        if user_id:
            qs = qs.exclude(id=user_id)
        if qs.exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        user_id = self.context.get('user_id')
        qs = User.objects.filter(email__iexact=value)
        if user_id:
            qs = qs.exclude(id=user_id)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None) or 'Staff@12345'
        with transaction.atomic():
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=password,
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                role='STAFF'
            )
            profile = StaffProfile.objects.create(
                user=user,
                phone=validated_data.get('phone', ''),
                department=validated_data.get('department', 'Library Operations'),
                status=validated_data.get('status', 'ACTIVE')
            )
            return user

    def update(self, instance, validated_data):
        with transaction.atomic():
            instance.username = validated_data.get('username', instance.username)
            instance.email = validated_data.get('email', instance.email)
            instance.first_name = validated_data.get('first_name', instance.first_name)
            instance.last_name = validated_data.get('last_name', instance.last_name)
            if validated_data.get('password'):
                instance.set_password(validated_data['password'])
            instance.save()

            profile, _ = StaffProfile.objects.get_or_create(user=instance)
            profile.phone = validated_data.get('phone', profile.phone)
            profile.department = validated_data.get('department', profile.department)
            profile.status = validated_data.get('status', profile.status)
            profile.save()
            return instance


class StudentDetailSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    full_name = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(source='user.date_joined')
    is_active = serializers.BooleanField(source='user.is_active')

    class Meta:
        model = StudentProfile
        fields = (
            'id', 'student_id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'department', 'status', 'is_active', 'date_joined'
        )

    def get_full_name(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name if name else obj.user.username

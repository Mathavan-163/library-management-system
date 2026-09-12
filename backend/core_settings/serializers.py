from rest_framework import serializers
from .models import LibrarySetting

class LibrarySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibrarySetting
        fields = (
            'id', 'borrow_period_days', 'fine_per_day', 'library_name',
            'contact_email', 'contact_phone', 'address', 'updated_at'
        )
        read_only_fields = ('id', 'updated_at')

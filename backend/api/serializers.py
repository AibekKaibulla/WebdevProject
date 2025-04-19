from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Event, Booking, Ticket

class SimpleUserSerializer(serializers.ModelSerializer):
    """
    minimal serializer for user details
    (no password, email, etc.)
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class EventSerializer(serializers.ModelSerializer):

    tickets_sold = serializers.IntegerField(read_only=True)
    tickets_available = serializers.IntegerField(read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'name',
            'description',
            'event_type',
            'event_type_display',
            'date_time',
            'venue_name',
            'address',
            'ticket_price',
            'total_capacity',
            'tickets_sold',
            'tickets_available',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id', 'tickets_sold', 'tickets_available', 'event_type_display', 'created_at', 'updated_at',
        ]

class TicketSerializer(serializers.ModelSerializer):

    class Meta:
        model = Ticket
        fields = [
            'id',
            'event',
            'booking',
            'ticket_code',
            'price_paid',
            'seat_info',
            'issued_at',
        ]

        read_only_fields = [
            'id', 'event', 'booking', 'ticket_code', 'issued_at',
        ]

class BookingSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    tickets = TicketSerializer(read_only=True, many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id',
            'user',
            'event',
            'booking_time',
            'status',
            'status_display',
            'tickets',
        ]

        read_only_fields = [
            'id', 'user', 'event', 'booking_time', 'status', 'status_display', 'tickets'
        ]

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(
        max_length=128,
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

class BookingCreateSerializer(serializers.Serializer):
    event_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(
        required=True,
        min_value=1,
        max_value=10,
        help_text="The number of tickets to book for the specified event."
    )

    def validate_event_id(self, value):
        """
        check that the event ID corresponds to an existing event.
        """
        if not Event.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"Event with ID {value} does not exist.")

        return value

class UserCreateSerializer(serializers.ModelSerializer):
    """
    serializer for creating new user accounts.
    """
    password2 = serializers.CharField(
        style={'input_type': 'password'},
        write_only=True,
        required=True,
        help_text="Confirm password."
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

        extra_kwargs = {
            'password': {
                'write_only': True,
                'style': {'input_type': 'password'},
                'min_length': 8
            },
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, data):
        """
        check that two passwords match
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')

        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        return user
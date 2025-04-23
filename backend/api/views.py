from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from django.db import transaction, models
from django.utils import timezone

from rest_framework import status, serializers, generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Event, Booking, Ticket
from .serializers import (
    EventSerializer, BookingSerializer, TicketSerializer,
    LoginSerializer, BookingCreateSerializer, UserCreateSerializer
)

User = get_user_model()

# =======================================
        # Authentication Views
# =======================================

class RegisterView(generics.CreateAPIView):
    """
    handles new user registration
    uses UserCreateSerializer to validate input and create the user object,
    including correct password hashing.
    Accessible to any user (authenticated or not).
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer

class LoginView(APIView):
    """
    handles user login and returns JWT access and refresh tokens.
    POST: username, password
    returns JWT access and refresh tokens upon successful authentication.
    accessible to any user.
    """

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True) #return 400 bad request

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # user authenticated successfully, generate tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid credentials" }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    return Response({"detail": "You have been logged out."}, status=status.HTTP_200_OK)


# =======================================
         # Event Views
# =======================================

class EventListCreateView(APIView):
    """
    list all events (GET) or create a new event (POST - Admin only).
    """
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            # only admin can create events
            return [IsAdminUser()]
        # anyone can view events
        return [AllowAny()]

    def get(self, request, *args, **kwargs):
        """
        returns a list of events
        """
        events = Event.objects.all().order_by('date_time')
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """
        create a new event (POST - Admin only)
        """
        serializer = EventSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EventDetailView(APIView):
    """
    handles retrieving (GET), updating (PUT, PATCH), and deleting (DELETE)
    a specific event instance identified by its primary key (pk).
    retrieving is public, Update/Delete operations are restricted to Admin users.
    """
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def get_object(self, pk):
        event = get_object_or_404(Event, pk=pk)
        return event

    def get(self, request, pk, *args, **kwargs):
        """
        get event by primary key (pk) (GET - AllowAny)
        """
        event = self.get_object(pk)

        serializer = EventSerializer(event, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk, *args, **kwargs):
        """
        update an event (PUT - Admin only)
        """
        event = self.get_object(pk)
        serializer = EventSerializer(instance=event, data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk, *args, **kwargs):
        """
        partially update an event (PATCH - Admin only)
        """
        event = self.get_object(pk)
        serializer = EventSerializer(instance=event, data=request.data, partial=True, context={'request': request})

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
        """
        remove an existing event (DELETE - Admin only)
        """
        event = self.get_object(pk)

        try:
            event.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except models.ProtectedError as e:
            related_objects = ", ".join([str(obj) for obj in e.protected_objects])
            return Response(
                {"detail": f"Cannot delete event: Related objects exist ({related_objects}). Please remove them first"},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EventListByTypeView(generics.ListAPIView):
    """
    GET events filtered by type (movies, concerts, etc.)
    """
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    EVENT_TYPE_MAP = {
        'movies': 'MOVIE',
        'concerts': 'CONCERT',
        'other': 'OTHER'
    }

    def get_queryset(self):
        url_slug = self.kwargs.get('event_type_slug')

        event_type_value = self.EVENT_TYPE_MAP.get(url_slug)

        if event_type_value:
            queryset = Event.objects.filter(event_type=event_type_value).order_by('date_time')
        else:
            queryset = Event.objects.none()

        return queryset
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def booking_create_view(request):
    """
    create a new booking (POST - AuthenticatedUser only)
    """
    serializer = BookingCreateSerializer(data=request.data)

    try:
        serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    event_id = validated_data['event_id']
    quantity = validated_data['quantity']
    user = request.user # get the authenticated user attached by middleware

    event = get_object_or_404(Event, pk=event_id)

    # check ticket availability
    if quantity > event.tickets_available:
        return Response(
            {"detail": f"Insufficient tickets available for `{event.name}`. Requested: {quantity}, Available: {event.tickets_available}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # perform booking and ticket creation via transaction
    try:
        with transaction.atomic():
            booking = Booking.objects.create(
                user=user,
                event = event,
                status = 'CONFIRMED'
            )

            tickets_to_create = []
            for _ in range(quantity):
                tickets_to_create.append(
                    Ticket(
                        event=event,
                        booking=booking,
                        price_paid=event.ticket_price
                    )
                )

            Ticket.objects.bulk_create(tickets_to_create)

            response_serializer = BookingSerializer(booking, context={'request': request})

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"Error during booking creating process: {e}")
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_booking_view(request):
    """
    :return a list of user's bookings', ordered by booking time
    """

    user = request.user

    user_bookings = Booking.objects.filter(user=user).order_by('-booking_time')

    serializer = BookingSerializer(user_bookings, many=True, context={'request': request})

    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retrieve_user_booking_view(request, pk):
    """ Retrieves details of a specific booking owned by the user. """
    user = request.user

    booking = get_object_or_404(Booking, pk=pk, user=user)
    serializer = BookingSerializer(booking, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def cancel_booking_view(request, pk):
    """
    update the booking status to 'CANCELLED'
    """
    user = request.user
    booking = get_object_or_404(Booking, pk=pk, user=user)

    if booking.status == 'CANCELLED':
        serializer = BookingSerializer(booking, context={'request': request})
        return Response(
            {"detail": "Booking was already cancelled.", "booking": serializer.data},
            status=status.HTTP_200_OK
        )

    booking.status = 'CANCELLED'

    try:
        booking.save(update_fields=['status'])
    except Exception as e:
        print(f"Error saving cancelled booking status: {e}")
        return Response(
            {"detail": "An error occurred while updating the booking status."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    serializer = BookingSerializer(booking, context={'request': request})

    return Response(serializer.data, status=status.HTTP_200_OK)

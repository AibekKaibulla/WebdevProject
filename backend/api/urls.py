from django.urls import path
from rest_framework_simplejwt.views import (TokenRefreshView)
from . import views

app_name = 'api'
urlpatterns = [
    # Authentication Endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'), # POST: Create new user
    path('auth/login/', views.LoginView.as_view(), name='token_obtain_pair'), # POST: Get access/refresh tokens
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # Refresh access token
    path('auth/logout/', views.logout_view, name='logout'), # POST: logout

    # Event endpoints
    path('events/', views.EventListCreateView.as_view(), name='event-list-create'), # GET: List events, Post:Create event (Admin)
    path('events/<int:pk>/', views.EventDetailView.as_view(), name='event-detail'), # GET: Retrieve, PUT/PATCH: Update, DELETE: Delete (Admin)
    path('events/movies/', views.EventListByTypeView.as_view(), {'event_type_slug': 'movies'}, name='event-list-movies'),
    path('events/concerts/', views.EventListByTypeView.as_view(), {'event_type_slug': 'concerts'}, name='event-list-concerts'),
    path('events/others/', views.EventListByTypeView.as_view(), {'event_type_slug': 'others'}, name='event-list-other'),

    #Booking endpoints
    path('bookings/', views.booking_create_view, name='booking-create'), # POST: Create a new booking for logged-in user
    path('bookings/mine/', views.list_user_booking_view, name='booking-list-mine'), # GET: List booking for logged-in user
    path('bookings/<int:pk>/', views.retrieve_user_booking_view, name='booking-detail-mine'), # GET: Retrieve specific booking for logged-in user
    path('bookings/<int:pk>/cancel/', views.cancel_booking_view, name='booking-cancel'), # PATCH: Cancel a specific booking for logged-in user
]


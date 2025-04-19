from django.contrib import admin
from .models import Event, Booking, Ticket

# Register your models here.
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('name', 'event_type', 'date_time', 'venue_name', 'ticket_price', 'total_capacity', 'tickets_available')
    list_filter = ('event_type', 'date_time', 'venue_name')
    search_fields = ('name', 'description', 'venue_name', 'address')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'event', 'booking_time', 'status')
    list_filter = ('status', 'event', 'user')
    search_fields = ('user__username', 'event__name')
    autocomplete_fields = ['user', 'event']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket_code', 'booking', 'event', 'price_paid', 'issued_at')
    list_filter = ('event',)
    search_fields = ('ticket_code', 'booking__user__username', 'event__name')
    autocomplete_fields = ['booking', 'event']
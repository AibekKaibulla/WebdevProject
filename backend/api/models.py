from sys import prefix

from django.db import models

import uuid # unique ticket ids
from django.conf import settings

class Event(models.Model):
    EVENT_TYPE_CHOICES = (
        ('CONCERT', 'Concert'),
        ('MOVIE', 'Movie'),
        ('OTHER', 'Other'),
        #etc..
    )

    name = models.CharField(max_length=200, help_text='The official name of the event.')
    description = models.TextField(help_text='A detailed description of the event.')
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default='OTHER',
        help_text='The genre of the event.',
    )
    date_time = models.DateTimeField(help_text='The date and time when the event was created.')
    venue_name = models.CharField(max_length=150, help_text='The name of the venue or location.')
    address = models.TextField(help_text="The full address of the venue.")
    ticket_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='The price for one ticket to this event.',
    )
    total_capacity = models.PositiveIntegerField(help_text='The maximum number of tickets available for this event.')
    created_at = models.DateTimeField(auto_now_add=True, help_text='Timestamp when the event was created.')
    updated_at = models.DateTimeField(auto_now=True, help_text='Timestamp when the event was updated.')

    def __str__(self):
        return f"{self.name} ({self.get_event_type_display()}) on {self.date_time.strftime('%Y-%m-%d %H:%M')}"

    @property
    def tickets_sold(self):
        return self.tickets.filter(booking__status='CONFIRMED').count()

    @property
    def tickets_available(self):
        return self.total_capacity - self.tickets_sold

    class Meta:
        ordering = ['date_time']


class Booking(models.Model):
    STATUS_CHOICES = (
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Canceled'),
    )

    # Booking -> User (Many-to-One)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='bookings',
        on_delete=models.CASCADE,
        help_text='The user who booked this booking.',
    )

    # Booking -> Event (Many-to-One)
    event = models.ForeignKey(
        Event,
        related_name='bookings',
        on_delete=models.PROTECT,
        help_text='The event being booked.',
    )
    booking_time = models.DateTimeField(auto_now_add=True, help_text='Timestamp when the booking was made.')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CONFIRMED',
        help_text='The current status of the booking.',
    )

    def __str__(self):
        user_identifier = getattr(self.user, self.user.USERNAME_FIELD, self.user.pk)
        return f"Booking {self.id} by {user_identifier} for {self.event.name}"

    class Meta:
        ordering = ['-booking_time'] # date ASC


class Ticket(models.Model):
    # Ticket -> Event (Many-to-One)
    event = models.ForeignKey(
        Event,
        related_name='tickets',
        on_delete=models.PROTECT,
        help_text='The event this ticket grants access to.',
    )

    # Ticket -> Booking (Many-to-One)
    booking = models.ForeignKey(
        Booking,
        related_name='tickets',
        on_delete=models.CASCADE, # no booking, no ticket
        help_text='The booking transaction this ticket belongs to.',
    )

    ticket_code = models.UUIDField(
        default=uuid.uuid4, # random UUID
        editable=False,
        unique=True,
        help_text='Unique identifier code for this specific ticket.'
    )

    price_paid = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text='The actual price paid for this specific ticket .'
    )

    seat_info = models.CharField(
        max_length = 50,
        blank=True,
        null=True,
        help_text="Specific seat assignment, if applicable (e.g., 'Section A, Row 5, Seat 12')."
    )

    issued_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when this ticket was generated.")

    def __str__(self):
        return f"Ticket {str(self.ticket_code)[:8]} for '{self.event.name}' (Booking ID: {self.booking.id})"

    class Meta:
        ordering = ['issued_at']

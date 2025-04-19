# Generated by Django 5.2 on 2025-04-19 20:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='status',
            field=models.CharField(choices=[('CONFIRMED', 'Confirmed'), ('CANCELLED', 'Cancelled')], default='CONFIRMED', help_text='The current status of the booking.', max_length=20),
        ),
    ]

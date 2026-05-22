from django.utils import timezone
from django.db import models
from .models import RestaurantConfig, FoodItem
from orders.models import DailyReport, DailyItemReport, Order, OrderItem
from django.db.models import Sum
import datetime

def trigger_daily_automation():
    """
    Checks if the day has changed and restaurant is open. 
    If so, generates yesterday's report and resets today's stock.
    """
    config, _ = RestaurantConfig.objects.get_or_create(id=1)
    now = timezone.localtime()
    today = now.date()
    current_time = now.time()
    
    # 1. Determine Opening/Closing for today
    current_day_name = now.strftime('%a')
    opening = config.opening_time
    
    if config.weekday_timing and current_day_name in config.weekday_timing:
        day_timing = config.weekday_timing[current_day_name]
        if 'open' in day_timing:
            try:
                opening = datetime.datetime.strptime(day_timing['open'], '%H:%M').time()
            except ValueError:
                pass

    # --- AUTO START DAY (Stock Reset) ---
    # Trigger if: we are past opening time AND we haven't reset today yet
    if current_time >= opening and (config.last_stock_reset_date is None or config.last_stock_reset_date < today):
        # Reset all items current stock to their default values
        FoodItem.objects.all().update(current_stock=models.F('default_stock'))
        
        config.last_stock_reset_date = today
        config.save(update_fields=['last_stock_reset_date'])

    # --- AUTO END DAY (Report Generation) ---
    # Trigger if: we are past opening time AND we haven't generated a report for YESTERDAY yet
    yesterday = today - datetime.timedelta(days=1)
    if current_time >= opening and (config.last_report_generated_date is None or config.last_report_generated_date < yesterday):
        # Double check if report for yesterday already exists
        if not DailyReport.objects.filter(date=yesterday).exists():
            generate_report_for_date(yesterday)
            
        config.last_report_generated_date = yesterday
        config.save(update_fields=['last_report_generated_date'])

def generate_report_for_date(target_date):
    day_name = target_date.strftime('%A')
    report, _ = DailyReport.objects.get_or_create(date=target_date, defaults={'day_name': day_name})
    
    orders = Order.objects.filter(created_at__date=target_date).exclude(status='cancelled')
    report.total_orders = orders.count()
    report.total_revenue = orders.aggregate(total=Sum('total_price'))['total'] or 0
    
    # Count distinct users
    active_auth_users = orders.exclude(user__isnull=True).values('user').distinct().count()
    active_guests = orders.filter(user__isnull=True).values('device_id').distinct().count()
    report.total_users_active = active_auth_users + active_guests
    report.save()
    
    # Generate itemized reports
    report.item_reports.all().delete()
    all_items = FoodItem.objects.all()
    for item in all_items:
        sold = OrderItem.objects.filter(
            order__created_at__date=target_date, 
            food_item=item
        ).exclude(order__status='cancelled').aggregate(total=Sum('quantity'))['total'] or 0
        
        DailyItemReport.objects.create(
            report=report,
            food_item=item,
            quantity_sold=sold,
            quantity_left=item.current_stock, # Note: this captures stock at the moment of report gen
            revenue=sold * item.price
        )

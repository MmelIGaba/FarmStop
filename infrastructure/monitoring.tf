# 1. SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "plaasstop-alerts"
}

# 2. Alarm: EC2 High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "plaasstop-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alert if Single Server CPU > 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.app_server.id
  }
}

# 3. (Deleted ALB Alarm to save money/reduce errors)
# 4. (Deleted Dashboard to save $3/month)
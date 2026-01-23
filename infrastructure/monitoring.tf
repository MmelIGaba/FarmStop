# infrastructure/monitoring.tf

# 1. SNS Topic for Alerts (e.g., email me when site is down)
resource "aws_sns_topic" "alerts" {
  name = "plaasstop-alerts"
}

# Note: You have to manually subscribe your email to this topic in AWS Console
# because Terraform cannot verify your email address automatically.

# 2. Alarm: EC2 High CPU (Scale up needed?)
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "plaasstop-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app_asg.name
  }
}

# 3. Alarm: Load Balancer 5xx Errors (Code Crashing)
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "plaasstop-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0" # Alert on ANY 500 error
  alarm_description   = "Alert if the backend throws 500 errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main_alb.arn_suffix
  }
}

# 4. Dashboard: The "Mission Control" View
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "Plaasstop-Overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.app_asg.name]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "EC2 CPU Usage"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main_alb.arn_suffix]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Traffic (Request Count)"
        }
      }
    ]
  })
}
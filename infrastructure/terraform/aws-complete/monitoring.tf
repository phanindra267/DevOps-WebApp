# ==============================================================================
# MONITORING & OBSERVABILITY - CloudWatch logs, alarms, SNS and dashboard.
# Complements the Prometheus + Grafana stack deployed on EKS (kubernetes/eks/).
# ==============================================================================

resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "${local.name_prefix}-vpc-flow-logs"
  retention_in_days = 30 # XX - replace

  tags = local.common_tags
}

# ---------- SNS alerting ----------
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---------- EC2 CPU alarm ----------
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  count = var.web_instance_count > 0 ? 1 : 0

  alarm_name          = "${local.name_prefix}-ec2-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  alarm_description   = "EC2 CPU utilisation above threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web[0].id
  }

  tags = local.common_tags
}

# ---------- RDS CPU alarm ----------
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name_prefix}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  alarm_description   = "RDS CPU utilisation above threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.app.id
  }

  tags = local.common_tags
}

# ---------- Executive dashboard ----------
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = var.dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "EC2 CPU Utilization"
          region  = var.aws_region
          view    = "timeSeries"
          metrics = length(aws_instance.web) > 0 ? [["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.web[0].id]] : []
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "RDS CPU Utilization"
          region  = var.aws_region
          view    = "timeSeries"
          metrics = [["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.app.id]]
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          title  = "VPC Flow Logs"
          region = var.aws_region
          query  = "SOURCE '${aws_cloudwatch_log_group.flow_logs.name}' | fields @timestamp, srcAddr, dstAddr, action | sort @timestamp desc | limit 50"
          view   = "table"
        }
      },
    ]
  })
}

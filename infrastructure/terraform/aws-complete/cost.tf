# ==============================================================================
# FINOPS - AWS BUDGETS, COST ANOMALY DETECTION & COST TAGS
# ==============================================================================

resource "aws_budgets_budget" "monthly" {
  name              = "${local.name_prefix}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = tostring(var.monthly_budget_amount)
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2026-01-01_00:00" # XX - replace with current billing period

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80 # XX - replace alert threshold %
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100 # XX - replace alert threshold %
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}

resource "aws_ce_anomaly_monitor" "ec2" {
  name         = "${local.name_prefix}-ec2-cost-anomaly"
  monitor_type = "CUSTOM"
  monitor_specification = jsonencode({
    Dimensions = {
      Key    = "SERVICE"
      Values = ["AmazonEC2"]
    }
  })

  tags = local.common_tags
}

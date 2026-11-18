# ==============================================================================
# Cost Explorer (ce:GetCostAndUsage) IS supported by this account, but the
# Terraform AWS provider has no data source for it. Query it with the AWS CLI:
#
#   aws ce get-cost-and-usage \
#     --time-period Start=2026-11-01,End=2026-11-18 \
#     --granularity MONTHLY --metrics BlendedCost
#
# No Terraform resource is defined here - so no unsupported resource is created.
# ==============================================================================

# ==============================================================================
# VPC PEERING
# Connects this VPC to a second VPC (on-prem via Site-to-Site VPN is handled in
# network.tf). If var.peer_vpc_id == "XX", a demo peer VPC with public/private
# subnets is created automatically so the peering is fully functional locally.
# Replace every "XX" peer variable to point at an existing VPC instead.
# ==============================================================================

locals {
  # When peer_vpc_id is left as the placeholder, create a demo peer VPC.
  create_peer_vpc = var.peer_vpc_id == "XX"
  peer_vpc_id     = local.create_peer_vpc ? aws_vpc.peer[0].id : var.peer_vpc_id
  peer_vpc_cidr   = local.create_peer_vpc ? aws_vpc.peer[0].cidr_block : var.peer_vpc_cidr
}

# ---------- Demo peer VPC (created only when peer_vpc_id is "XX") ----------
resource "aws_vpc" "peer" {
  count = local.create_peer_vpc ? 1 : 0

  cidr_block           = var.peer_vpc_cidr == "XX" ? "192.168.0.0/16" : var.peer_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-peer-vpc" })
}

resource "aws_subnet" "peer" {
  count = local.create_peer_vpc ? 1 : 0

  vpc_id            = aws_vpc.peer[0].id
  cidr_block        = "192.168.1.0/24"
  availability_zone = var.availability_zones[0]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-peer-subnet" })
}

# ---------- VPC Peering connection (requester side) ----------
resource "aws_vpc_peering_connection" "this" {
  peer_region   = var.peer_vpc_region == "XX" ? var.aws_region : var.peer_vpc_region
  vpc_id        = aws_vpc.this.id
  peer_vpc_id   = local.peer_vpc_id
  peer_owner_id = local.create_peer_vpc ? data.aws_caller_identity.current.account_id : var.aws_account_id == "XX" ? null : var.aws_account_id
  auto_accept   = local.create_peer_vpc

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-peering" })
}

# ---------- Accept a peering request when peering with an existing VPC ----------
resource "aws_vpc_peering_connection_accepter" "accepter" {
  count = local.create_peer_vpc ? 0 : 1

  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
  auto_accept               = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-peering-accepter" })
}

# ---------- Routes through the peering connection ----------
# Main VPC private + public route tables -> peer CIDR
resource "aws_route" "private_to_peer" {
  route_table_id            = aws_route_table.private.id
  destination_cidr_block    = local.peer_vpc_cidr == "XX" ? "192.168.0.0/16" : local.peer_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
}

resource "aws_route" "public_to_peer" {
  route_table_id            = aws_route_table.public.id
  destination_cidr_block    = local.peer_vpc_cidr == "XX" ? "192.168.0.0/16" : local.peer_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
}

# Peer VPC route table -> main VPC CIDR (only when peer VPC is created here)
resource "aws_route_table" "peer" {
  count = local.create_peer_vpc ? 1 : 0

  vpc_id = aws_vpc.peer[0].id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-peer-rt" })
}

resource "aws_route" "peer_to_main" {
  count = local.create_peer_vpc ? 1 : 0

  route_table_id            = aws_route_table.peer[0].id
  destination_cidr_block    = var.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
}

resource "aws_route_table_association" "peer" {
  count = local.create_peer_vpc ? 1 : 0

  subnet_id      = aws_subnet.peer[0].id
  route_table_id = aws_route_table.peer[0].id
}

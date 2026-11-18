# ==============================================================================
# EC2 - NGINX WEB SERVERS, EBS VOLUME, ELASTIC IP, SSH KEY PAIR
# Multiple instances spread across public subnets, user_data installs and
# starts Nginx and deploys a simple web application.
# ==============================================================================

# ---------- SSH key pair (private key is stored encrypted in Terraform state) ----------
resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  key_name   = var.key_pair_name
  public_key = tls_private_key.ssh.public_key_openssh

  tags = local.common_tags
}

# ---------- EC2 web instances ----------
resource "aws_instance" "web" {
  count = var.web_instance_count

  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public[count.index % length(aws_subnet.public)].id
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true
  key_name                    = aws_key_pair.generated.key_name
  iam_instance_profile        = aws_iam_instance_profile.web.name
  monitoring                  = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20 # XX - replace
    encrypted             = true
    delete_on_termination = true
  }

  user_data = <<-USERDATA
              #!/bin/bash
              yum update -y
              amazon-linux-extras install -y nginx1 || yum install -y nginx
              systemctl enable nginx
              systemctl start nginx
              cat <<'INDEXHTML' > /usr/share/nginx/html/index.html
              <!DOCTYPE html>
              <html>
              <head><title>CloudOps Sentinel</title></head>
              <body style="background:#0b0f19;color:#f8fafc;text-align:center;padding:60px;font-family:sans-serif;">
                <h1 style="color:#38bdf8;">CloudOps Sentinel Web Application</h1>
                <p>Provisioned by Terraform &mdash; INT 378</p>
                <p>Instance: ${local.name_prefix}-${count.index + 1}</p>
              </body>
              </html>
              INDEXHTML
              USERDATA

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-${count.index + 1}"
    Role = "WebServer"
  })
}

# ---------- Extra encrypted EBS data volume (attached to first web server) ----------
resource "aws_ebs_volume" "data" {
  count = var.web_instance_count > 0 ? 1 : 0

  availability_zone = var.availability_zones[0]
  size              = 10 # XX - replace
  type              = "gp3"
  encrypted         = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-webdata" })
}

resource "aws_volume_attachment" "data" {
  count = length(aws_ebs_volume.data)

  device_name = "/dev/sdh"
  volume_id   = aws_ebs_volume.data[0].id
  instance_id = aws_instance.web[0].id
}

# ---------- Elastic IP for a stable public endpoint ----------
resource "aws_eip" "web" {
  count  = var.web_instance_count > 0 ? 1 : 0
  domain = "vpc"

  instance = aws_instance.web[0].id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-eip" })
}

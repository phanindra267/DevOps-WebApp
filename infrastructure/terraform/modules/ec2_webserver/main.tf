# ==============================================================================
# MODULE: EC2 WEB SERVER (APACHE / NGINX) & SECURITY GROUP
# Aligns with INT 378 Practical Syllabus (Session 2026-27 - Experiment 1 & 5)
# Provisions an EC2 instance within VPC public subnet, configures Security Group,
# attaches SSH key, installs Nginx/Apache via user_data, and exposes public IP.
# ==============================================================================

variable "name" {
  description = "Name prefix for the EC2 resources"
  type        = string
  default     = "cloudops-webserver"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "VPC ID where the EC2 instance and SG will be deployed"
  type        = string
  default     = "vpc-0123456789abcdef0"
}

variable "subnet_id" {
  description = "Public subnet ID for web server ingress"
  type        = string
  default     = "subnet-0123456789abcdef0"
}

variable "instance_type" {
  description = "EC2 instance type (Free Tier eligible: t2.micro / t3.micro)"
  type        = string
  default     = "t2.micro"
}

variable "ami_id" {
  description = "Amazon Linux 2 / Ubuntu 22.04 AMI ID"
  type        = string
  default     = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 AMI
}

variable "key_name" {
  description = "SSH Key Pair name for remote access (SSH/RDP)"
  type        = string
  default     = "cloudops-keypair"
}

# 1. Security Group: Ingress for HTTP (80), HTTPS (443), and SSH (22)
resource "aws_security_group" "web_sg" {
  name        = "${var.name}-sg-${var.environment}"
  description = "Security Group allowing inbound HTTP, HTTPS, and SSH traffic"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow inbound HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound SSH for remote management"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # In production, restrict to administrator VPN / IP
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.name}-sg"
    Environment = var.environment
    ManagedBy   = "CloudOps Sentinel (INT 378)"
  }
}

# 2. EC2 Instance with Automated Nginx Web Server Installation (user_data)
resource "aws_instance" "web_server" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [aws_security_group.web_sg.id]
  associate_public_ip_address = true
  key_name                    = var.key_name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              amazon-linux-extras install -y nginx1
              systemctl enable nginx
              systemctl start nginx
              
              # Deploy Simple Web Application
              cat << 'HTML' > /usr/share/nginx/html/index.html
              <!DOCTYPE html>
              <html>
              <head>
                <title>CloudOps Sentinel | Web Server</title>
                <style>
                  body { font-family: sans-serif; background: #0b0f19; color: #f8fafc; text-align: center; padding-top: 60px; }
                  .card { background: #111827; border: 1px solid #38bdf8; border-radius: 12px; display: inline-block; padding: 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
                  h1 { color: #38bdf8; }
                  .badge { background: #10b981; color: #fff; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>CloudOps Sentinel Web App</h1>
                  <p class="badge">Nginx Web Server Active</p>
                  <p>Course INT 378 Practical Defense | Session 2026-27</p>
                  <p>Candidate: Kakumani Phaneendra | Reg: 12418953 (LPU)</p>
                </div>
              </body>
              </html>
              HTML
              EOF

  tags = {
    Name        = "${var.name}-${var.environment}"
    Environment = var.environment
    Course      = "INT 378"
    Role        = "WebServer"
  }
}

# Outputs
output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.web_server.id
}

output "public_ip" {
  description = "Public IP address of the deployed web application"
  value       = aws_instance.web_server.public_ip
}

output "public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.web_server.public_dns
}

output "security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web_sg.id
}

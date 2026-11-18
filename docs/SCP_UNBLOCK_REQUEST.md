# Request to Authorize AWS Services for CA Project

**To:** AWS Organizations Administrator (org `o-imhofhvg46`, management account `673576402218`)
**From:** Kakumani Phaneendra (Reg: 12418953)
**Account:** `314510965803` | **Region:** `ap-south-1`

## Problem

My account has `AdministratorAccess` attached, but every EC2/VPC/S3/CloudFormation action is denied by an explicit deny in Service Control Policy:

```
arn:aws:organizations::673576402218:policy/o-imhofhvg46/service_control_policy/p-6k0fjqz3
```

Example error:
```
An error occurred (UnauthorizedOperation) when calling the DescribeVpcs operation:
User: arn:aws:iam::314510965803:user/Kakumani_Phaneendra is not authorized to perform:
ec2:DescribeVpcs with an explicit deny in a service control policy: ...p-6k0fjqz3
```

An SCP explicit deny overrides IAM policies — this cannot be fixed from within the account.

## Requested action

Please attach an SCP to account `314510965803` that does **not** explicitly deny the following actions (or add an exception for this account / principal):

```
ec2:DescribeVpcs, ec2:CreateVpc, ec2:CreateSubnet, ec2:CreateInternetGateway,
ec2:AttachInternetGateway, ec2:CreateRouteTable, ec2:CreateRoute,
ec2:AssociateRouteTable, ec2:CreateSecurityGroup,
ec2:AuthorizeSecurityGroupIngress, ec2:AuthorizeSecurityGroupEgress,
ec2:DescribeImages, ec2:DescribeKeyPairs, ec2:RunInstances, ec2:DescribeInstances
s3:CreateBucket, s3:PutBucketVersioning, s3:PutEncryptionConfiguration,
s3:PutPublicAccessBlock, s3:ListAllMyBuckets
cloudformation:ValidateTemplate, cloudformation:CreateChangeSet,
cloudformation:DescribeChangeSet, cloudformation:CreateStack,
cloudformation:DescribeStacks, cloudformation:DeleteStack
```

## After approval - verify with these commands

```powershell
aws ec2 describe-vpcs --region ap-south-1
aws s3api list-buckets
aws cloudformation validate-template --template-body file://infrastructure/cloudformation/ca-prototype.yaml --region ap-south-1
```

Then deploy (template is ready):

```powershell
aws cloudformation create-stack --stack-name cloudops-ca --region ap-south-1 `
  --template-body file://infrastructure/cloudformation/ca-prototype.yaml `
  --parameters ParameterKey=AmiId,ParameterValue=<real-AL2023-AMI> `
               ParameterKey=KeyName,ParameterValue=<your-keypair> `
               ParameterKey=SshLocationCidr,ParameterValue=<your-ip>/32
```

The complete deployment plan, cost assessment and resource list are in
`infrastructure/cloudformation/CA_PROTOTYPE_GUIDE.md`.

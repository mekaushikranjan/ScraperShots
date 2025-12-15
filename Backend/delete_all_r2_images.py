import os
from dotenv import load_dotenv
load_dotenv()
import boto3
from botocore.client import Config

CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_ACCESS_KEY_ID = os.getenv("CLOUDFLARE_ACCESS_KEY_ID")
CLOUDFLARE_SECRET_ACCESS_KEY = os.getenv("CLOUDFLARE_SECRET_ACCESS_KEY")
CLOUDFLARE_R2_BUCKET_NAME = os.getenv("CLOUDFLARE_R2_BUCKET_NAME")

R2_ENDPOINT = f"https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"

session = boto3.session.Session()
s3 = session.client(
    service_name="s3",
    aws_access_key_id=CLOUDFLARE_ACCESS_KEY_ID,
    aws_secret_access_key=CLOUDFLARE_SECRET_ACCESS_KEY,
    endpoint_url=R2_ENDPOINT,
    config=Config(signature_version="s3v4"),
    region_name="auto"
)

def delete_all_images():
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=CLOUDFLARE_R2_BUCKET_NAME)
    to_delete = []
    total = 0
    for page in pages:
        contents = page.get('Contents', [])
        for obj in contents:
            to_delete.append({'Key': obj['Key']})
            total += 1
            if len(to_delete) == 1000:
                s3.delete_objects(Bucket=CLOUDFLARE_R2_BUCKET_NAME, Delete={'Objects': to_delete})
                print(f"Deleted {len(to_delete)} objects...")
                to_delete = []
    if to_delete:
        s3.delete_objects(Bucket=CLOUDFLARE_R2_BUCKET_NAME, Delete={'Objects': to_delete})
        print(f"Deleted {len(to_delete)} objects...")
    print(f"Finished deleting {total} objects from bucket '{CLOUDFLARE_R2_BUCKET_NAME}'")

if __name__ == "__main__":
    delete_all_images() 
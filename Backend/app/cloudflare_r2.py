import os
from typing import Optional
from dotenv import load_dotenv
load_dotenv()

import boto3
from botocore.client import Config
import mimetypes

CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_ACCESS_KEY_ID = os.getenv("CLOUDFLARE_ACCESS_KEY_ID")
CLOUDFLARE_SECRET_ACCESS_KEY = os.getenv("CLOUDFLARE_SECRET_ACCESS_KEY")
CLOUDFLARE_R2_BUCKET_NAME = os.getenv("CLOUDFLARE_R2_BUCKET_NAME")
CLOUDFLARE_R2_PUBLIC_URL = os.getenv("CLOUDFLARE_R2_PUBLIC_URL")

# Check for missing variables
missing = []
for var, val in [
    ("CLOUDFLARE_ACCOUNT_ID", CLOUDFLARE_ACCOUNT_ID),
    ("CLOUDFLARE_ACCESS_KEY_ID", CLOUDFLARE_ACCESS_KEY_ID),
    ("CLOUDFLARE_SECRET_ACCESS_KEY", CLOUDFLARE_SECRET_ACCESS_KEY),
    ("CLOUDFLARE_R2_BUCKET_NAME", CLOUDFLARE_R2_BUCKET_NAME),
    ("CLOUDFLARE_R2_PUBLIC_URL", CLOUDFLARE_R2_PUBLIC_URL)
]:
    if not val:
        missing.append(var)
if missing:
    raise RuntimeError(f"Missing required Cloudflare R2 environment variables: {', '.join(missing)}")

# Endpoint for R2
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

def upload_image_to_r2(file_path: str, object_name: Optional[str] = None) -> str:
    """
    Uploads an image to Cloudflare R2 and returns the public URL.
    """
    if object_name is None:
        object_name = os.path.basename(file_path)
    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = "image/jpeg"  # Default fallback
    s3.upload_file(
        file_path,
        CLOUDFLARE_R2_BUCKET_NAME,
        object_name,
        ExtraArgs={"ContentType": content_type}
    )
    return f"{CLOUDFLARE_R2_PUBLIC_URL}/{object_name}"

async def upload_image_bytes_to_r2(image_bytes: bytes, object_name: str) -> str:
    """
    Uploads image bytes to Cloudflare R2 and returns the public URL.
    """
    # Guess content type from extension
    ext = os.path.splitext(object_name)[1].lower()
    if ext in [".jpg", ".jpeg"]:
        content_type = "image/jpeg"
    elif ext == ".png":
        content_type = "image/png"
    else:
        content_type = "application/octet-stream"
    s3.put_object(Bucket=CLOUDFLARE_R2_BUCKET_NAME, Key=object_name, Body=image_bytes, ContentType=content_type)
    return f"{CLOUDFLARE_R2_PUBLIC_URL}/{object_name}" 
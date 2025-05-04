import logging
import os
import random
import secrets
import string
import threading
from locust import between, task, HttpUser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

class TestingLocust(HttpUser):
    wait_time = between(1, 3)
    host = os.getenv("TARGET_HOST")
    if not host:
        logger.warning("TARGET_HOST not set, defaulting to http://localhost:3000")
        host = "http://localhost:3000"

    paste_ids = []
    paste_lock = threading.Lock()

    def on_start(self):
        logger.info("User session started")

    @task(2)
    def visit_main_page(self):
        with self.client.get("/", name="/", catch_response=True, timeout=10) as response:
            if response.status_code in (200, 304):
                response.success()
                logger.info("Visit main page successful")
            elif response.status_code == 0:
                response.failure("Connection failed: No response")
                logger.error("Failed to visit main page: No response")
            else:
                response.failure(response.text)
                logger.error(f"Failed to visit main page (status={response.status_code}): {response.text}")

    @task(3)
    def create_paste(self):
        content = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(200))
        title = ''.join(secrets.choice(string.ascii_letters) for _ in range(10)) if secrets.randbelow(2) else ""
        expires_in = secrets.choice(["", "1440", "10080", "43200"])
        visibility = secrets.choice(["PUBLIC"])

        form_data = {
            "content": content,
            "title": title,
            "expires_in": expires_in,
            "visibility": visibility
        }

        with self.client.post("/paste", data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded"},
                              allow_redirects=False, catch_response=True, timeout=10) as response:
            if response.status_code == 302:
                paste_id = response.headers.get('Location', '').split('/')[-1]
                if paste_id:
                    with self.paste_lock:
                        self.paste_ids.append(paste_id)
                    logger.info(f"Created new paste with ID: {paste_id}")
                response.success()
            else:
                error_message = "Connection failed: No response" if response.status_code == 0 else response.text
                response.failure(error_message)
                logger.error(f"Failed to create paste (status={response.status_code}): {error_message}")

    @task(2)
    def visit_paste(self):
        with self.paste_lock:
            if not self.paste_ids:
                logger.warning("No paste_ids available to visit.")
                return
            paste_id = random.choice(self.paste_ids)

        with self.client.get(f"/paste/{paste_id}", name="/paste/:id", catch_response=True, timeout=10) as response:
            status = response.status_code
            if status in (200, 404):
                response.success()
                logger.info(f"Visit paste {paste_id} success (status={status})")
            elif status == 0:
                response.failure("Connection failed: No response")
                logger.error(f"Failed to visit paste {paste_id} (status=0)")
            else:
                response.failure(response.text)
                logger.error(f"Failed to visit paste {paste_id} (status={status}): {response.text}")

    @task(1)
    def visit_paste_list(self):
        with self.client.get("/public", name="/public", catch_response=True, timeout=10) as response:
            if response.status_code == 200:
                response.success()
                logger.info("Paste list loaded successfully")
            elif response.status_code == 0:
                response.failure("Connection failed: No response")
                logger.error("Connection failed while loading paste list")
            else:
                response.failure(response.text)
                logger.error(f"Failed to load paste list (status={response.status_code}): {response.text}")

    @task(1)
    def visit_stats(self):
        year = random.randint(2020, 2025)
        month = random.choice(range(1, 13))
        month_str = f"{year}-{month:02d}"
        url = f"/stats/{month_str}"

        with self.client.get(url, name="/stats", catch_response=True, timeout=10) as response:
            if response.status_code == 200:
                response.success()
                logger.info(f"Stats for {month_str} loaded successfully")
            elif response.status_code == 0:
                response.failure("Connection error: No response received")
                logger.error("Unable to load stats: No response")
            else:
                response.failure(f"Unexpected status code: {response.status_code} - {response.text}")
                logger.error(f"Failed to retrieve stats (status={response.status_code}): {response.text}")

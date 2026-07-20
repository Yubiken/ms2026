import os


def get_admin_users() -> set[str]:
    return {
        username.strip()
        for username in os.getenv("ADMIN_USERS", "").split(",")
        if username.strip()
    }


def is_admin_username(username: str) -> bool:
    return username in get_admin_users()

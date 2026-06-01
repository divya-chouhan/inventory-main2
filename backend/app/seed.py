"""Idempotent demo-data seeding so a fresh deployment isn't empty."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Customer, Product


def seed(db: Session) -> None:
    if db.scalar(select(Product).limit(1)) or db.scalar(select(Customer).limit(1)):
        return  # already seeded

    products = [
        Product(sku="KB-MX-001", name="Mechanical Keyboard MX", description="Hot-swappable 75% mechanical keyboard.", price=129.99, stock=40),
        Product(sku="MS-PRO-002", name="Wireless Pro Mouse", description="Low-latency ergonomic wireless mouse.", price=69.50, stock=60),
        Product(sku="MON-27-4K", name='27" 4K Monitor', description="IPS 4K display with USB-C.", price=389.00, stock=15),
        Product(sku="HS-NC-09", name="Noise-Cancelling Headset", description="ANC over-ear headset.", price=199.00, stock=8),
        Product(sku="WC-1080-A", name="1080p Webcam", description="Auto-focus streaming webcam.", price=59.99, stock=0),
        Product(sku="DCK-USB-C", name="USB-C Docking Station", description="11-in-1 dock with dual HDMI.", price=149.00, stock=25),
    ]
    customers = [
        Customer(name="Aarav Sharma", email="aarav@example.com", phone="+91 98765 43210"),
        Customer(name="Mia Chen", email="mia.chen@example.com", phone="+1 415 555 0199"),
        Customer(name="Liam O'Brien", email="liam@example.com", phone="+353 1 555 0123"),
    ]
    db.add_all(products + customers)
    db.commit()

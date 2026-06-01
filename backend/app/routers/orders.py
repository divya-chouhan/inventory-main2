"""Order endpoints.

Core business rules implemented here:
  * An order references an existing customer.
  * Every line item references an existing product.
  * Inventory is validated BEFORE the order is created.
  * Orders CANNOT be created when stock is insufficient (409 returned).
  * Stock is reduced automatically and atomically when an order is placed.

The whole operation runs in a single transaction with row-level locking
(SELECT ... FOR UPDATE) so concurrent orders cannot oversell stock.
"""
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Customer, Order, OrderItem, OrderStatus, Product
from ..schemas import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.scalars(
        select(Order).options(selectinload(Order.items)).order_by(Order.id.desc())
    ).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.scalar(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    # 1. Customer must exist.
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found")

    # 2. Merge duplicate product lines into a single quantity per product.
    requested: dict[int, int] = defaultdict(int)
    for item in payload.items:
        requested[item.product_id] += item.quantity

    # 3. Lock the relevant product rows so concurrent orders can't oversell.
    products = db.scalars(
        select(Product)
        .where(Product.id.in_(requested.keys()))
        .with_for_update()
    ).all()
    product_map = {p.id: p for p in products}

    missing = [pid for pid in requested if pid not in product_map]
    if missing:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"Product(s) not found: {', '.join(map(str, missing))}",
        )

    # 4. Validate stock for every line BEFORE mutating anything.
    insufficient = []
    for pid, qty in requested.items():
        product = product_map[pid]
        if product.stock < qty:
            insufficient.append(
                f"'{product.name}' (SKU {product.sku}): requested {qty}, "
                f"available {product.stock}"
            )
    if insufficient:
        # Nothing has been committed; stock is untouched.
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Insufficient stock for: " + "; ".join(insufficient),
        )

    # 5. All good -> reduce stock and build the order atomically.
    order = Order(customer_id=customer.id, status=OrderStatus.confirmed, total_amount=0)
    db.add(order)

    total = 0.0
    for pid, qty in requested.items():
        product = product_map[pid]
        product.stock -= qty  # automatic stock reduction
        unit_price = float(product.price)
        total += unit_price * qty
        order.items.append(
            OrderItem(product_id=pid, quantity=qty, unit_price=unit_price)
        )

    order.total_amount = round(total, 2)

    db.commit()
    db.refresh(order)
    # Re-load items relationship for the response.
    db.refresh(order, attribute_names=["items"])
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)
):
    order = db.scalar(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    # Cancelling a non-cancelled order restocks the inventory.
    if payload.status == OrderStatus.cancelled and order.status != OrderStatus.cancelled:
        for item in order.items:
            product = db.get(Product, item.product_id, with_for_update=True)
            if product:
                product.stock += item.quantity

    order.status = payload.status
    db.commit()
    db.refresh(order)
    db.refresh(order, attribute_names=["items"])
    return order

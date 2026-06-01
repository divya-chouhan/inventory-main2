"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, engine, get_db, SessionLocal
from .models import Customer, Order, OrderItem, Product
from .routers import customers, orders, products
from .schemas import DashboardStats
from .seed import seed

settings = get_settings()

LOW_STOCK_THRESHOLD = 10


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.auto_init_db:
        Base.metadata.create_all(bind=engine)
        if settings.seed_demo_data:
            db = SessionLocal()
            try:
                seed(db)
            finally:
                db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "environment": settings.environment}


@app.get(settings.api_v1_prefix + "/dashboard", response_model=DashboardStats, tags=["dashboard"])
def dashboard(db: Session = Depends(get_db)):
    total_products = db.scalar(select(func.count(Product.id))) or 0
    total_customers = db.scalar(select(func.count(Customer.id))) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0
    total_revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0))) or 0
    low_stock = db.scalar(
        select(func.count(Product.id)).where(
            Product.stock > 0, Product.stock <= LOW_STOCK_THRESHOLD
        )
    ) or 0
    out_of_stock = db.scalar(select(func.count(Product.id)).where(Product.stock == 0)) or 0
    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=float(total_revenue),
        low_stock_count=low_stock,
        out_of_stock_count=out_of_stock,
    )


app.include_router(products.router, prefix=settings.api_v1_prefix)
app.include_router(customers.router, prefix=settings.api_v1_prefix)
app.include_router(orders.router, prefix=settings.api_v1_prefix)

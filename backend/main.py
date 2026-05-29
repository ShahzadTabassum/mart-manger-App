from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    products, inventory, categories, suppliers,
    sales, customers, employees, returns, auth,
    shop_auth, shop_products, shop_orders
)

app = FastAPI(title="MartManager API", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Management routes
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(sales.router)
app.include_router(customers.router)
app.include_router(employees.router)
app.include_router(returns.router)

# Shop routes
app.include_router(shop_auth.router)
app.include_router(shop_products.router)
app.include_router(shop_orders.router)

@app.get("/")
def root():
    return {"message": "MartManager API v5.0 ✅"}

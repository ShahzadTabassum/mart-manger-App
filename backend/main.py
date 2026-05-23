from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, inventory, categories, suppliers, sales

app = FastAPI(
    title="MartManager API",
    description="Backend API for Shopping Mart Management System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(sales.router)

@app.get("/")
def root():
    return {"message": "MartManager API v2.0 is running ✅"}

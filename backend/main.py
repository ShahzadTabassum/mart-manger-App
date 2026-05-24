from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, inventory, categories, suppliers, sales, customers, employees, returns, auth

app = FastAPI(title="MartManager API", version="4.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(sales.router)
app.include_router(customers.router)
app.include_router(employees.router)
app.include_router(returns.router)

@app.get("/")
def root():
    return {"message": "MartManager API v4.0 ✅"}

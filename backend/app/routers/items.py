from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from typing import List, Dict
from app.models.schemas import ItemCreate, ItemResponse, ItemListResponse

router = APIRouter(prefix="/items", tags=["Items"])

# In-memory mock database for template demonstration
db_items: List[Dict] = [
    {
        "id": 1,
        "name": "FastAPI Boilerplate",
        "description": "Pre-configured Starlette async routes and Pydantic schemas",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": 2,
        "name": "Vite React UI",
        "description": "Modern frontend with custom glassmorphism design system",
        "created_at": datetime.now().isoformat()
    }
]

@router.get("", response_model=ItemListResponse)
async def get_items():
    """
    List all registered items.
    """
    return ItemListResponse(
        count=len(db_items),
        items=db_items
    )

@router.post("", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate):
    """
    Create a new item.
    """
    new_id = max([i["id"] for i in db_items], default=0) + 1
    new_item = {
        "id": new_id,
        "name": item.name,
        "description": item.description or "No description",
        "created_at": datetime.now().isoformat()
    }
    db_items.append(new_item)
    return {"message": "Item created successfully", "item": new_item}

@router.delete("/{item_id}", response_model=Dict)
async def delete_item(item_id: int):
    """
    Delete an item by ID.
    """
    global db_items
    initial_length = len(db_items)
    db_items = [i for i in db_items if i["id"] != item_id]
    
    if len(db_items) == initial_length:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} not found"
        )
    return {"message": f"Item {item_id} deleted successfully"}

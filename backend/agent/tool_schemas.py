PRODUCT_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_products",
        "description": (
            "Search the NeedNow product catalog using hybrid "
            "keyword and semantic search. Use this when the user "
            "wants to find, compare, buy, or get recommendations "
            "for products available in NeedNow."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "A concise product search query derived "
                        "from the user's shopping need."
                    ),
                },
                "limit": {
                    "type": "integer",
                    "description": (
                        "Maximum number of products to retrieve."
                    ),
                    "default": 5,
                },
            },
            "required": ["query"],
        },
    },
}

GET_PRODUCT_DETAILS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_product_details",
        "description": (
            "Retrieve detailed information for a single product by its product_id (UUID), "
            "including full specifications, features, description, stock quantity, and pricing. "
            "Use this when inspecting product details, checking compatibility, or providing "
            "in-depth information about a specific product."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": (
                        "The unique UUID string of the product."
                    ),
                },
            },
            "required": ["product_id"],
        },
    },
}


AGENT_TOOLS = [
    PRODUCT_SEARCH_TOOL,
    GET_PRODUCT_DETAILS_TOOL,
]
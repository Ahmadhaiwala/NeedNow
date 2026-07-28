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


COMPARE_PRODUCTS_TOOL = {
    "type": "function",
    "function": {
        "name": "compare_products",
        "description": (
            "Retrieve structured details and specifications for up to 4 products side-by-side. "
            "Use this when the user asks to compare multiple products, evaluate differences, "
            "or decide between two or more items."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "product_ids": {
                    "type": "array",
                    "items": {
                        "type": "string",
                    },
                    "description": (
                        "List of product UUID strings to compare (maximum 4)."
                    ),
                },
            },
            "required": ["product_ids"],
        },
    },
}


GET_RECOMMENDATIONS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_recommendations",
        "description": (
            "Retrieve personalized product recommendations for the user based on "
            "their shopping history, preferences, and activity context. "
            "Use this when the user asks for recommendations, suggestions, or 'what should I buy'."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": (
                        "Number of recommendations to retrieve (default 5, max 10)."
                    ),
                    "default": 5,
                },
            },
            "required": [],
        },
    },
}


GET_CART_TOOL = {
    "type": "function",
    "function": {
        "name": "get_cart",
        "description": (
            "Retrieve the current user's active shopping cart items, quantities, "
            "unit prices, line totals, and subtotal."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
}

ADD_TO_CART_TOOL = {
    "type": "function",
    "function": {
        "name": "add_to_cart",
        "description": (
            "Add a product to the user's shopping cart or increase its quantity. "
            "Validates product stock before adding."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "The unique UUID string of the product to add.",
                },
                "quantity": {
                    "type": "integer",
                    "description": "Quantity to add (default 1).",
                    "default": 1,
                },
            },
            "required": ["product_id"],
        },
    },
}

GET_RECENT_ORDERS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_recent_orders",
        "description": (
            "Retrieve recent orders placed by the user, including status, payment status, "
            "totals, dates, and order items."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of recent orders to return (default 5).",
                    "default": 5,
                },
            },
            "required": [],
        },
    },
}

GET_ORDER_STATUS_TOOL = {
    "type": "function",
    "function": {
        "name": "get_order_status",
        "description": (
            "Retrieve the detailed status, payment status, and items for a specific order ID."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "The order ID to check.",
                },
            },
            "required": ["order_id"],
        },
    },
}


SEARCH_EXTERNAL_PRODUCTS_TOOL = {
    "type": "function",
    "function": {
        "name": "search_external_products",
        "description": (
            "Search current external shopping listings using Google Shopping. "
            "Use this when the user asks for real-world products, current marketplace prices, "
            "products from external stores like Amazon/Walmart/etc, price comparisons, "
            "or wants to compare NeedNow products against other retailers. "
            "Returns real shopping results with prices, ratings, and merchant information."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "Product search query (e.g., 'RTX 4060 gaming laptop', 'AirPods Pro')."
                    ),
                },
                "min_price": {
                    "type": "number",
                    "description": "Minimum price filter (optional).",
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price filter (optional).",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default 8, max 15).",
                    "default": 8,
                },
            },
            "required": ["query"],
        },
    },
}


AGENT_TOOLS = [
    PRODUCT_SEARCH_TOOL,
    GET_PRODUCT_DETAILS_TOOL,
    COMPARE_PRODUCTS_TOOL,
    GET_RECOMMENDATIONS_TOOL,
    GET_CART_TOOL,
    ADD_TO_CART_TOOL,
    GET_RECENT_ORDERS_TOOL,
    GET_ORDER_STATUS_TOOL,
    SEARCH_EXTERNAL_PRODUCTS_TOOL,
]




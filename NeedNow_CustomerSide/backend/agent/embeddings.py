from sentence_transformers import SentenceTransformer



MODEL_NAME = "all-MiniLM-L6-v2"

# Loaded once when this module is imported.
# Don't instantiate SentenceTransformer inside embed_query().
_model = None


def get_embedding_model():
    """
    Lazily load and cache the embedding model.
    """

    global _model

    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)

    return _model


def embed_query(text):
    """
    Convert a search query into a 384-dimensional embedding.

    Uses the same model as ProductEmbedding.
    """

    if not text or not text.strip():
        return None

    model = get_embedding_model()

    embedding = model.encode(
        text.strip(),
        normalize_embeddings=True,
    )

    return embedding.tolist()



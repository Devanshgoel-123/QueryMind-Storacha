import chromadb
from chromadb.config import Settings, DEFAULT_TENANT, DEFAULT_DATABASE

def main():
  
    client = chromadb.PersistentClient(
        path="chroma_db",
        settings=Settings(),
        tenant=DEFAULT_TENANT,
        database=DEFAULT_DATABASE,
    )

    collection_name = "rag_chunks"

   
    try:
        client.delete_collection(name=collection_name)
        print(f"✅ Successfully deleted collection '{collection_name}'")
    except Exception as e:
        print(f"❌ Could not delete collection '{collection_name}': {e}")

    # 3️⃣ List what remains
    remaining = client.list_collections()
    print("Remaining collections:", remaining)

if __name__ == "__main__":
    main()

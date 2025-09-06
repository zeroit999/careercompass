// MongoDB initialization script for RAG system
print('🚀 Initializing RAG System Database...');

// Switch to rag_system database
db = db.getSiblingDB('rag_system');

// Create collections
db.createCollection('documents_raw');
db.createCollection('documents_rag');

// Create indexes for better performance
db.documents_raw.createIndex({ "metadata.source": 1 });
db.documents_raw.createIndex({ "metadata.created_at": 1 });

// Create vector search index for RAG collection (MongoDB Atlas style)
// Note: This requires MongoDB Atlas or MongoDB with Atlas Search enabled
try {
  db.documents_rag.createSearchIndex(
    "rag_vector_index",
    {
      "definition": {
        "fields": [
          {
            "type": "vector",
            "path": "embedding",
            "numDimensions": 1536,
            "similarity": "cosine"
          },
          {
            "type": "string",
            "path": "metadata.source"
          }
        ]
      }
    }
  );
  print('✅ Vector search index created');
} catch (e) {
  print('⚠️  Vector search index creation skipped (requires Atlas)');
}

// Create regular indexes for text search
db.documents_rag.createIndex({ "content": "text" });
db.documents_rag.createIndex({ "metadata.source": 1 });
db.documents_rag.createIndex({ "metadata.chunk_id": 1 });

print('✅ RAG System Database initialized successfully!');

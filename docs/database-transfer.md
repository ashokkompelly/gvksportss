# Database backups and transfers

All application records and uploaded images are stored in MongoDB. Use MongoDB Atlas backups or the MongoDB Database Tools (`mongodump` and `mongorestore`) to back up and restore the configured database, including GridFS collections and internal counters. Restore into a separate database and verify it before switching `MONGODB_DATABASE`. Keep backups private because they contain account data.

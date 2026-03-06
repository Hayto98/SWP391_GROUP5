-- Migration: Create completionattachment table
-- Run this once on the database if the table does not already exist.

CREATE TABLE IF NOT EXISTS completionattachment (
    completion_attachment_id CHAR(36)      NOT NULL,
    collected_record_id      CHAR(36)      NOT NULL,
    file_uri                 VARCHAR(1024) NOT NULL,
    uploaded_at              DATETIME      NOT NULL,
    PRIMARY KEY (completion_attachment_id),
    CONSTRAINT fk_ca_collected_record
        FOREIGN KEY (collected_record_id)
        REFERENCES collectedrecord (collected_record_id)
        ON DELETE CASCADE
);

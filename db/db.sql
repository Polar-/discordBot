CREATE TABLE commands (
    command	VARCHAR(20)	PRIMARY KEY,
    response TEXT NOT NULL,
    added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB;
